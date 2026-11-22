package cat.xoriguer.temes;

import android.content.ActivityNotFoundException;
import android.os.Handler;
import android.os.Looper;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Point;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Pont entre la web (www/js/plataforma.js) i el telèfon:
 *  info()  model, nom comercial, resolució real i versió de MIUI / HyperOS
 *  apps()  apps de la pantalla d'inici (paquet, nom i icona)
 *  desa()  desa el .mtz a Descàrregues
 *  aplicaDirecte() desa el tema com a imatge i el gestor de temes l'aplica sol (vegeu més avall)
 *  aplica() reserva: obre el gestor amb un fitxer de Descàrregues (l'usuari el tria al selector)
 */
@CapacitorPlugin(name = "Temes")
public class TemesPont extends Plugin {

    private static String prop(String clau) {
        try {
            Class<?> c = Class.forName("android.os.SystemProperties");
            Object v = c.getMethod("get", String.class).invoke(null, clau);
            return v == null ? "" : v.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }

    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("model", Build.MODEL);
        r.put("marca", Build.MANUFACTURER);
        String nom = prop("ro.product.marketname");
        if (nom.isEmpty()) nom = prop("ro.product.vendor.marketname");
        if (nom.isEmpty()) nom = Build.MANUFACTURER + " " + Build.MODEL;
        r.put("nom", nom);
        Point p = new Point();
        getActivity().getWindowManager().getDefaultDisplay().getRealSize(p);
        r.put("W", Math.min(p.x, p.y));
        r.put("H", Math.max(p.x, p.y));
        String hyper = prop("ro.mi.os.version.name");
        String miui = prop("ro.miui.ui.version.name");
        if (!hyper.isEmpty()) r.put("miui", "HyperOS " + hyper.replace("OS", ""));
        else if (!miui.isEmpty()) {
            String d = miui.replaceAll("[^0-9]", "");
            String v = d.length() >= 3 ? d.substring(0, 2) + (d.charAt(2) == '0' ? "" : "." + d.charAt(2)) : d;
            r.put("miui", "MIUI " + v);
        } else r.put("avis", "Aquest telèfon no és un Xiaomi: el tema només funciona amb MIUI.");
        call.resolve(r);
    }

    @PluginMethod
    public void apps(PluginCall call) {
        new Thread(() -> {
            try {
                PackageManager pm = getContext().getPackageManager();
                Intent i = new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER);
                List<ResolveInfo> llista = pm.queryIntentActivities(i, 0);
                Set<String> vistos = new HashSet<>();
                JSArray out = new JSArray();
                String jo = getContext().getPackageName();
                for (ResolveInfo ri : llista) {
                    String p = ri.activityInfo.packageName;
                    if (p.equals(jo) || !vistos.add(p)) continue;
                    JSObject a = new JSObject();
                    a.put("paquet", p);
                    a.put("nom", String.valueOf(ri.loadLabel(pm)));
                    try {
                        a.put("icona", "data:image/png;base64," + pngBase64(ri.loadIcon(pm), 144));
                    } catch (Exception ignored) {
                    }
                    out.put(a);
                }
                JSObject r = new JSObject();
                r.put("apps", out);
                call.resolve(r);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }).start();
    }

    private static String pngBase64(Drawable d, int mida) {
        Bitmap b = Bitmap.createBitmap(mida, mida, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, mida, mida);
        d.draw(c);
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, o);
        return Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
    }

    @PluginMethod
    public void desa(PluginCall call) {
        String nom = call.getString("nom", "Xoriguer.mtz");
        String dades = call.getString("dades", "");
        new Thread(() -> {
            try {
                byte[] bytes = Base64.decode(dades, Base64.DEFAULT);
                String cami;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContext().getContentResolver();
                    Uri col = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                    // si ja l'havíem desat abans, el substituïm (si no, Android posaria «nom (1).mtz»)
                    cr.delete(col, MediaStore.MediaColumns.DISPLAY_NAME + "=? AND " + MediaStore.MediaColumns.RELATIVE_PATH + "=?",
                            new String[]{nom, Environment.DIRECTORY_DOWNLOADS + "/"});
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, nom);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, "application/octet-stream");
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/");
                    Uri uri = cr.insert(col, v);
                    if (uri == null) throw new Exception("MediaStore");
                    try (OutputStream os = cr.openOutputStream(uri)) {
                        os.write(bytes);
                    }
                    String real = nom;
                    try (Cursor c = cr.query(uri, new String[]{MediaStore.MediaColumns.DISPLAY_NAME}, null, null, null)) {
                        if (c != null && c.moveToFirst()) real = c.getString(0);
                    }
                    cami = Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + Environment.DIRECTORY_DOWNLOADS + "/" + real;
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    dir.mkdirs();
                    File f = new File(dir, nom);
                    try (FileOutputStream os = new FileOutputStream(f)) {
                        os.write(bytes);
                    }
                    cami = f.getAbsolutePath();
                }
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("cami", cami);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("No s'ha pogut desar: " + e.getMessage());
            }
        }).start();
    }

    // ------------------------------------------------------------ aplicar directament (sense selector)
    // El gestor de temes no pot llegir fitxers qualsevol d'altres apps (Descàrregues: obre un selector), però sí
    // IMATGES de les carpetes públiques. El .mtz es desa com «Imatges/Xoriguer Temes/xoriguer-tema.jpg» (és un zip:
    // al gestor no li importa l'extensió), s'aplica i al cap d'uns segons s'esborra perquè no quedi a la Galeria.
    // Provat al Mi 10T Lite (MIUI 14, Android 12). Una carpeta oculta (.xoriguer) NO va: el gestor no hi té accés.
    private static final String CARPETA_IMG = Environment.DIRECTORY_PICTURES + "/Xoriguer Temes/";
    private static final String NOM_IMG = "xoriguer-tema.jpg";

    private void esborraImatges() {
        try {
            getContext().getContentResolver().delete(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                    MediaStore.MediaColumns.RELATIVE_PATH + "=?", new String[]{CARPETA_IMG});
        } catch (Exception ignored) {
        }
    }

    @Override
    public void load() {
        if (Build.VERSION.SDK_INT >= 29) new Thread(this::esborraImatges).start();   // restes d'un tema anterior
    }

    /** Només les parts triades (Motor.flagsParts a www/js/motor.js): la resta del tema del telèfon no es toca. */
    private static void posaParts(Intent i, PluginCall call) {
        Long f = call.getLong("flags", -1L);
        if (f != null && f != -1L) {
            i.putExtra("theme_apply_flags", (long) f);
            i.putExtra("theme_remove_flags", 0L);
        }
    }

    @PluginMethod
    public void aplicaDirecte(PluginCall call) {
        if (Build.VERSION.SDK_INT < 29) { call.reject("antic"); return; }
        String dades = call.getString("dades", "");
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                esborraImatges();
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, NOM_IMG);
                v.put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, CARPETA_IMG);
                Uri uri = cr.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new Exception("MediaStore");
                try (OutputStream os = cr.openOutputStream(uri)) {
                    os.write(Base64.decode(dades, Base64.DEFAULT));
                }
                String real = NOM_IMG;
                try (Cursor c = cr.query(uri, new String[]{MediaStore.MediaColumns.DISPLAY_NAME}, null, null, null)) {
                    if (c != null && c.moveToFirst()) real = c.getString(0);
                }
                String cami = Environment.getExternalStorageDirectory().getAbsolutePath() + "/" + CARPETA_IMG + real;
                Intent i = new Intent();
                i.setClassName("com.android.thememanager", "com.android.thememanager.ApplyThemeForScreenshot");
                i.putExtra("theme_file_path", cami);
                i.putExtra("api_called_from", "xoriguer-temes");
                posaParts(i, call);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                getActivity().startActivity(i);
                // el gestor copia el tema a /data/system/theme en pocs segons: després ja el podem esborrar
                new Handler(Looper.getMainLooper()).postDelayed(() -> new Thread(this::esborraImatges).start(), 45000);
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("tria", false);
                call.resolve(r);
            } catch (ActivityNotFoundException e) {
                esborraImatges();
                call.reject("sense gestor de temes");
            } catch (Exception e) {
                esborraImatges();
                call.reject(String.valueOf(e.getMessage()));
            }
        }).start();
    }

    @PluginMethod
    public void obreUrl(PluginCall call) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(call.getString("url", "")));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void aplica(PluginCall call) {
        String cami = call.getString("cami", "");
        JSObject r = new JSObject();
        try {
            Intent i = new Intent();
            i.setClassName("com.android.thememanager", "com.android.thememanager.ApplyThemeForScreenshot");
            i.putExtra("theme_file_path", cami);
            i.putExtra("api_called_from", "xoriguer-temes");
                posaParts(i, call);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            getActivity().startActivity(i);
            r.put("ok", true);
            // des de Descàrregues el gestor obre el selector (l'usuari hi toca el fitxer); des de la seva carpeta l'aplica sol
            r.put("tria", !cami.contains("/Android/data/com.android.thememanager/"));
        } catch (ActivityNotFoundException | SecurityException e) {
            r.put("ok", false);
            r.put("missatge", "Aquest telèfon no té el gestor de temes de MIUI. El fitxer és a Descàrregues: " + cami);
        }
        call.resolve(r);
    }
}
