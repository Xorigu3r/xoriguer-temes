package cat.xoriguer.temes;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
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
 *  aplica() obre el gestor de temes de MIUI perquè apliqui el fitxer (l'usuari el tria al selector)
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

    // ------------------------------------------------------------ carpeta del gestor de temes
    // A Android 11 i 12 l'usuari pot donar permís a Android/data/com.android.thememanager amb el selector de carpetes.
    // Llavors el .mtz es desa allà i el gestor l'aplica directament (sense que l'usuari hagi de triar el fitxer).
    // A Android 13+ ja no es pot: es fa servir Descàrregues + el selector del gestor.
    private static final String EXT = "com.android.externalstorage.documents";
    private static final String DOC_TEMES = "primary:Android/data/com.android.thememanager";

    private Uri arbreTemes() {
        for (android.content.UriPermission p : getContext().getContentResolver().getPersistedUriPermissions()) {
            Uri u = p.getUri();
            if (!EXT.equals(u.getAuthority()) || !p.isWritePermission()) continue;
            try {
                String id = DocumentsContract.getTreeDocumentId(u);
                if (DOC_TEMES.startsWith(id) || id.startsWith(DOC_TEMES)) return u;
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    @PluginMethod
    public void carpeta(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ok", arbreTemes() != null);
        r.put("possible", Build.VERSION.SDK_INT >= 30 && Build.VERSION.SDK_INT <= 32);
        call.resolve(r);
    }

    @PluginMethod
    public void demanaCarpeta(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.putExtra(DocumentsContract.EXTRA_INITIAL_URI, DocumentsContract.buildDocumentUri(EXT, DOC_TEMES));
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        startActivityForResult(call, i, "carpetaFeta");
    }

    @ActivityCallback
    private void carpetaFeta(PluginCall call, ActivityResult res) {
        JSObject r = new JSObject();
        Intent d = res.getData();
        if (res.getResultCode() == Activity.RESULT_OK && d != null && d.getData() != null) {
            try {
                getContext().getContentResolver().takePersistableUriPermission(d.getData(),
                        Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (Exception ignored) {
            }
        }
        r.put("ok", arbreTemes() != null);
        call.resolve(r);
    }

    /** Document fill (directori) dins de l'arbre: si no existeix, el crea. */
    private Uri directori(ContentResolver cr, Uri arbre, String pareId, String nom) throws Exception {
        String id = pareId + "/" + nom;
        Uri u = DocumentsContract.buildDocumentUriUsingTree(arbre, id);
        try (Cursor c = cr.query(u, new String[]{DocumentsContract.Document.COLUMN_DOCUMENT_ID}, null, null, null)) {
            if (c != null && c.moveToFirst()) return u;
        } catch (Exception ignored) {
        }
        Uri pare = DocumentsContract.buildDocumentUriUsingTree(arbre, pareId);
        Uri nou = DocumentsContract.createDocument(cr, pare, DocumentsContract.Document.MIME_TYPE_DIR, nom);
        if (nou == null) throw new Exception("no puc crear " + nom);
        return nou;
    }

    @PluginMethod
    public void desaATemes(PluginCall call) {
        String nom = call.getString("nom", "Xoriguer.mtz");
        String dades = call.getString("dades", "");
        new Thread(() -> {
            try {
                Uri arbre = arbreTemes();
                if (arbre == null) throw new Exception("sense permís");
                ContentResolver cr = getContext().getContentResolver();
                directori(cr, arbre, DOC_TEMES, "files");
                Uri dir = directori(cr, arbre, DOC_TEMES + "/files", "xoriguer");
                Uri vell = DocumentsContract.buildDocumentUriUsingTree(arbre, DOC_TEMES + "/files/xoriguer/" + nom);
                try {
                    DocumentsContract.deleteDocument(cr, vell);
                } catch (Exception ignored) {
                }
                Uri f = DocumentsContract.createDocument(cr, dir, "application/octet-stream", nom);
                if (f == null) throw new Exception("no puc crear el fitxer");
                try (OutputStream os = cr.openOutputStream(f, "w")) {
                    os.write(Base64.decode(dades, Base64.DEFAULT));
                }
                String real = nom;
                try (Cursor c = cr.query(f, new String[]{DocumentsContract.Document.COLUMN_DISPLAY_NAME}, null, null, null)) {
                    if (c != null && c.moveToFirst()) real = c.getString(0);
                }
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("cami", Environment.getExternalStorageDirectory().getAbsolutePath()
                        + "/Android/data/com.android.thememanager/files/xoriguer/" + real);
                call.resolve(r);
            } catch (Exception e) {
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
