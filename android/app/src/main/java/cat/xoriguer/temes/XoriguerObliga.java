package cat.xoriguer.temes;

import android.app.Activity;
import android.app.Application;
import android.app.Dialog;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Xoriguer · actualització obligatòria de l'APK (tot l'ecosistema).
 *
 * En obrir l'app (i en tornar-hi al cap d'una estona) llegeix https://xoriguer.dev/versions/<app>/versio.json.
 * Si hi ha una APK més nova (apk_codi > versionCode instal·lat) i el versio.json diu "obliga": true, mostra una
 * pantalla que no es pot tancar: «Instal·la» baixa l'APK (comprova l'sha256) i obre l'instal·lador d'Android
 * (PackageInstaller: no cal FileProvider). Sense connexió o si xoriguer.dev no respon, deixa entrar.
 * Seguretat: si la instal·lació falla 3 cops (p. ex. una firma antiga), deixa «Continua de moment».
 *
 * Ús (MainActivity.onCreate, després de super.onCreate):  XoriguerObliga.comprova(this, "<app>");
 * A mà (botó «Busca actualitzacions»):                     XoriguerObliga.busca(activity, "<app>");
 * Manifest: INTERNET i REQUEST_INSTALL_PACKAGES.
 * Original: XoriguerAPKs/plantilla/XoriguerObliga.java (cat.xoriguer.temes = paquet de l'app). Integrar: integra_obliga.py
 */
public final class XoriguerObliga {
    private XoriguerObliga() { }

    private static final String BASE = "https://xoriguer.dev/versions/";
    private static final long TORNA = 60L * 60 * 1000;           // en tornar a l'app, com a molt cada hora
    private static final String ACCIO_FI = ".XORIGUER_INSTALLACIO";

    private static String app = "";
    private static long darrera = 0;
    private static boolean registrat = false;
    private static Dialog obert = null;
    private static JSONObject pendent = null;                   // versió que s'està demanant

    // ------------------------------------------------------------------ entrada
    /** A l'arrencada: comprova en segon pla i, si cal, bloqueja amb la pantalla d'actualització. */
    public static void comprova(final Activity a, String nomApp) {
        try {
            app = nomApp;
            if (!registrat) {
                registrat = true;
                a.getApplication().registerActivityLifecycleCallbacks(new Cicle(a.getClass()));
            }
            mira(a, false);
        } catch (Throwable ignored) { /* mai no ha d'impedir obrir l'app */ }
    }

    /** Botó «Busca actualitzacions»: diu si ja és la darrera; si n'hi ha una, la mostra (amb «Més tard» si no és obligatòria). */
    public static void busca(final Activity a, String nomApp) {
        app = nomApp;
        Toast.makeText(a, t(a, "buscant"), Toast.LENGTH_SHORT).show();
        mira(a, true);
    }

    private static void mira(final Activity a, final boolean manual) {
        darrera = System.currentTimeMillis();
        final Handler h = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            JSONObject j = null;
            try { j = new JSONObject(llegeix(BASE + app + "/versio.json?t=" + System.currentTimeMillis())); } catch (Throwable ignored) { }
            final JSONObject jj = j;
            h.post(() -> {
                try {
                    if (a.isFinishing()) return;
                    if (jj == null) { if (manual) Toast.makeText(a, t(a, "error"), Toast.LENGTH_LONG).show(); return; }
                    long codi = jj.optLong("apk_codi", 0);
                    String url = jj.optString("apk", "");
                    boolean nova = codi > codiInstal(a) && url.startsWith("https://");
                    boolean obliga = jj.optBoolean("obliga", false);
                    if (nova && (obliga || manual)) mostra(a, jj, obliga);
                    else if (!nova && obert != null) { obert.dismiss(); obert = null; }   // ja s'ha instal·lat
                    else if (!nova && manual) Toast.makeText(a, t(a, "darrera").replace("{v}", versioInstal(a)), Toast.LENGTH_LONG).show();
                } catch (Throwable ignored) { }
            });
        }).start();
    }

    // ------------------------------------------------------------------ pantalla
    private static void mostra(final Activity a, final JSONObject j, final boolean obliga) {
        if (obert != null && obert.isShowing()) return;
        pendent = j;
        final SharedPreferences pr = a.getSharedPreferences("xoriguer_obliga", Context.MODE_PRIVATE);
        final String clau = "fallades_" + j.optLong("apk_codi");
        final Dialog d = new Dialog(a, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        d.requestWindowFeature(Window.FEATURE_NO_TITLE);
        d.setCancelable(false);
        float dp = a.getResources().getDisplayMetrics().density;

        LinearLayout fons = new LinearLayout(a);
        fons.setGravity(Gravity.CENTER);
        fons.setPadding((int) (20 * dp), (int) (20 * dp), (int) (20 * dp), (int) (20 * dp));
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xFF24344A, 0xFF1A2533});
        fons.setBackground(g);

        LinearLayout c = new LinearLayout(a);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding((int) (22 * dp), (int) (22 * dp), (int) (22 * dp), (int) (18 * dp));
        GradientDrawable cg = new GradientDrawable();
        cg.setColor(0xFF27354A);
        cg.setCornerRadius(20 * dp);
        cg.setStroke((int) dp, 0xFF41506A);
        c.setBackground(cg);
        fons.addView(c, new LinearLayout.LayoutParams(Math.min(a.getResources().getDisplayMetrics().widthPixels - (int) (40 * dp), (int) (440 * dp)), ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView titol = text(a, obliga ? t(a, "titol") : t(a, "titolNo"), 21, 0xFFF6EFE2, true);
        c.addView(titol);
        String v = j.optString("apk_versio", j.optString("versio", ""));
        TextView cos = text(a, (obliga ? t(a, "cos") : t(a, "cosNo")).replace("{v}", v).replace("{a}", versioInstal(a)), 15, 0xFFB9B2A5, false);
        cos.setPadding(0, (int) (10 * dp), 0, (int) (14 * dp));
        c.addView(cos);
        final ProgressBar barra = new ProgressBar(a, null, android.R.attr.progressBarStyleHorizontal);
        barra.setMax(100);
        barra.setVisibility(View.GONE);
        c.addView(barra, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, (int) (10 * dp)));
        final TextView estat = text(a, "", 14, 0xFFFFA82E, false);
        estat.setPadding(0, (int) (6 * dp), 0, (int) (6 * dp));
        c.addView(estat);

        final TextView instal = boto(a, t(a, "instal"), true);
        c.addView(instal);
        final TextView segon = boto(a, obliga ? t(a, "continua") : t(a, "tard"), false);
        // «Més tard» (no obligatòria) o «Continua de moment» (només després de 3 intents fallits)
        segon.setVisibility(!obliga || pr.getInt(clau, 0) >= 3 ? View.VISIBLE : View.GONE);
        c.addView(segon);

        instal.setOnClickListener(x -> {
            if (Build.VERSION.SDK_INT >= 26 && !a.getPackageManager().canRequestPackageInstalls()) {
                // primer cal deixar que aquesta app instal·li apps
                estat.setText(t(a, "permis"));
                try { a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.getPackageName()))); }
                catch (Throwable e) { a.startActivity(new Intent(Settings.ACTION_SECURITY_SETTINGS)); }
                return;
            }
            instal.setEnabled(false);
            instal.setAlpha(0.5f);
            barra.setVisibility(View.VISIBLE);
            estat.setText(t(a, "baixant").replace("{p}", ""));
            baixaIInstalla(a, j, barra, estat, () -> {
                // ha fallat: torna a deixar provar
                int n = pr.getInt(clau, 0) + 1;
                pr.edit().putInt(clau, n).apply();
                instal.setEnabled(true);
                instal.setAlpha(1f);
                barra.setVisibility(View.GONE);
                if (n >= 3) segon.setVisibility(View.VISIBLE);
            });
        });
        segon.setOnClickListener(x -> { d.dismiss(); obert = null; });
        d.setOnKeyListener((di, k, e) -> {
            if (k == KeyEvent.KEYCODE_BACK && e.getAction() == KeyEvent.ACTION_UP) {
                if (!obliga) { d.dismiss(); obert = null; } else a.moveTaskToBack(true);
                return true;
            }
            return false;
        });
        d.setContentView(fons);
        if (d.getWindow() != null) d.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        obert = d;
        d.show();
    }

    private static TextView text(Context a, String s, int sp, int color, boolean negreta) {
        TextView v = new TextView(a);
        v.setText(s);
        v.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        v.setTextColor(color);
        if (negreta) v.setTypeface(Typeface.DEFAULT_BOLD);
        return v;
    }

    private static TextView boto(Context a, String s, boolean primari) {
        float dp = a.getResources().getDisplayMetrics().density;
        TextView b = text(a, s, 16, primari ? 0xFF1E2A3B : 0xFFF6EFE2, primari);
        b.setGravity(Gravity.CENTER);
        b.setPadding(0, (int) (14 * dp), 0, (int) (14 * dp));
        GradientDrawable g = primari
                ? new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[]{0xFFFFA82E, 0xFFF2650F})
                : new GradientDrawable();
        if (!primari) g.setColor(0xFF31405A);
        g.setCornerRadius(14 * dp);
        b.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = (int) (8 * dp);
        b.setLayoutParams(lp);
        b.setClickable(true);
        b.setFocusable(true);
        return b;
    }

    // ------------------------------------------------------------------ baixar i instal·lar
    private static void baixaIInstalla(final Activity a, final JSONObject j, final ProgressBar barra, final TextView estat, final Runnable fallada) {
        final Handler h = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            PackageInstaller.Session s = null;
            try {
                PackageInstaller pi = a.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams sp = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                sp.setAppPackageName(a.getPackageName());
                int id = pi.createSession(sp);
                s = pi.openSession(id);
                HttpURLConnection c = connexio(j.optString("apk"));
                long total = c.getContentLengthLong();
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                try (InputStream in = c.getInputStream(); OutputStream out = s.openWrite("app.apk", 0, total > 0 ? total : -1)) {
                    byte[] buf = new byte[65536];
                    long fet = 0;
                    int n, pc = -1;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        md.update(buf, 0, n);
                        fet += n;
                        final int p = total > 0 ? (int) (fet * 100 / total) : 0;
                        if (p != pc) { pc = p; final long f = fet; h.post(() -> { barra.setProgress(p); estat.setText(t(a, "baixant").replace("{p}", total > 0 ? p + " %" : (f / 1048576) + " MB")); }); }
                    }
                    s.fsync(out);
                }
                String esperat = j.optString("apk_sha256", "");
                if (!esperat.isEmpty() && !hex(md.digest()).equalsIgnoreCase(esperat)) throw new Exception("sha256");
                // el resultat arriba aquí: si cal, Android demana confirmació (Instal·la)
                final String accio = a.getPackageName() + ACCIO_FI;
                BroadcastReceiver r = new BroadcastReceiver() {
                    @Override public void onReceive(Context cx, Intent i) {
                        int st = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
                        if (st == PackageInstaller.STATUS_PENDING_USER_ACTION) {
                            Intent conf = i.getParcelableExtra(Intent.EXTRA_INTENT);
                            if (conf != null) { conf.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); try { a.startActivity(conf); } catch (Throwable ignored) { } }
                            estat.setText(t(a, "confirma"));
                            return;
                        }
                        try { cx.unregisterReceiver(this); } catch (Throwable ignored) { }
                        if (st != PackageInstaller.STATUS_SUCCESS) { estat.setText(t(a, "errInstal")); fallada.run(); }
                    }
                };
                if (Build.VERSION.SDK_INT >= 33) a.getApplicationContext().registerReceiver(r, new IntentFilter(accio), Context.RECEIVER_NOT_EXPORTED);
                else a.getApplicationContext().registerReceiver(r, new IntentFilter(accio));
                Intent fi = new Intent(accio).setPackage(a.getPackageName());
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                PendingIntent p = PendingIntent.getBroadcast(a, 4747, fi, flags);
                h.post(() -> estat.setText(t(a, "installant")));
                s.commit(p.getIntentSender());
                s.close();
            } catch (Throwable e) {
                if (s != null) try { s.abandon(); } catch (Throwable ignored) { }
                h.post(() -> { estat.setText(t(a, "errBaixa")); fallada.run(); });
            }
        }).start();
    }

    private static HttpURLConnection connexio(String url) throws Exception {
        for (int i = 0; i < 5; i++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(8000);
            c.setReadTimeout(20000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", "Xoriguer");
            int r = c.getResponseCode();
            if (r >= 300 && r < 400 && c.getHeaderField("Location") != null) { url = new URL(new URL(url), c.getHeaderField("Location")).toString(); c.disconnect(); continue; }
            if (r != 200) throw new Exception("HTTP " + r);
            return c;
        }
        throw new Exception("massa redireccions");
    }

    private static String llegeix(String url) throws Exception {
        HttpURLConnection c = connexio(url);
        c.setReadTimeout(8000);
        try (InputStream in = c.getInputStream()) {
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) o.write(b, 0, n);
            return o.toString("UTF-8");
        }
    }

    private static String hex(byte[] b) {
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(String.format("%02x", x));
        return s.toString();
    }

    @SuppressWarnings("deprecation")
    private static long codiInstal(Context c) {
        try {
            PackageInfo p = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode;
        } catch (Throwable e) { return Long.MAX_VALUE; }   // si no se sap, no molestis
    }

    private static String versioInstal(Context c) {
        try { return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName; } catch (Throwable e) { return ""; }
    }

    // ------------------------------------------------------------------ en tornar a l'app
    private static final class Cicle implements Application.ActivityLifecycleCallbacks {
        private final Class<?> principal;
        Cicle(Class<?> p) { principal = p; }
        @Override public void onActivityResumed(Activity a) {
            if (a.getClass() != principal) return;
            try {
                // ha tornat de l'instal·lador o dels ajustos: si la pantalla és oberta, torna a mirar de seguida
                if (obert != null || System.currentTimeMillis() - darrera > TORNA) mira(a, false);
            } catch (Throwable ignored) { }
        }
        @Override public void onActivityDestroyed(Activity a) {
            if (a.getClass() == principal && obert != null) { try { obert.dismiss(); } catch (Throwable ignored) { } obert = null; }
        }
        @Override public void onActivityCreated(Activity a, Bundle b) { }
        @Override public void onActivityStarted(Activity a) { }
        @Override public void onActivityPaused(Activity a) { }
        @Override public void onActivityStopped(Activity a) { }
        @Override public void onActivitySaveInstanceState(Activity a, Bundle b) { }
    }

    // ------------------------------------------------------------------ textos (ca, es, fr, en)
    private static String t(Context c, String k) {
        String l = Locale.getDefault().getLanguage();
        int i = "es".equals(l) ? 1 : "fr".equals(l) ? 2 : "en".equals(l) ? 3 : 0;
        String[] v;
        switch (k) {
            case "titol": v = new String[]{"Cal actualitzar l'app", "Hay que actualizar la app", "Mise à jour nécessaire", "Update required"}; break;
            case "titolNo": v = new String[]{"Hi ha una versió nova", "Hay una versión nueva", "Une nouvelle version est disponible", "A new version is available"}; break;
            case "cos": v = new String[]{"Hi ha la versió {v} (tens la {a}). Per continuar, instal·la-la: no es perd res del que tens.",
                    "Está la versión {v} (tienes la {a}). Para continuar, instálala: no se pierde nada de lo que tienes.",
                    "La version {v} est disponible (vous avez la {a}). Pour continuer, installez-la : vous ne perdez rien.",
                    "Version {v} is available (you have {a}). To continue, install it: you won't lose anything."}; break;
            case "cosNo": v = new String[]{"Hi ha la versió {v} (tens la {a}). S'instal·la per sobre i no es perd res.",
                    "Está la versión {v} (tienes la {a}). Se instala encima y no se pierde nada.",
                    "La version {v} est disponible (vous avez la {a}). Elle s'installe par-dessus, sans rien perdre.",
                    "Version {v} is available (you have {a}). It installs over the current one without losing anything."}; break;
            case "instal": v = new String[]{"Instal·la", "Instalar", "Installer", "Install"}; break;
            case "tard": v = new String[]{"Més tard", "Más tarde", "Plus tard", "Later"}; break;
            case "continua": v = new String[]{"Continua de moment", "Continuar por ahora", "Continuer pour l'instant", "Continue for now"}; break;
            case "baixant": v = new String[]{"Baixant… {p}", "Descargando… {p}", "Téléchargement… {p}", "Downloading… {p}"}; break;
            case "installant": v = new String[]{"Instal·lant…", "Instalando…", "Installation…", "Installing…"}; break;
            case "confirma": v = new String[]{"Toca «Instal·la» o «Actualitza» a la finestra d'Android.", "Toca «Instalar» o «Actualizar» en la ventana de Android.", "Touchez « Installer » ou « Mettre à jour » dans la fenêtre d'Android.", "Tap “Install” or “Update” in Android's window."}; break;
            case "permis": v = new String[]{"Activa «Permet d'aquesta font» i torna aquí.", "Activa «Permitir de esta fuente» y vuelve aquí.", "Activez « Autoriser cette source » puis revenez ici.", "Turn on “Allow from this source” and come back here."}; break;
            case "errBaixa": v = new String[]{"No s'ha pogut baixar. Mira la connexió i torna-ho a provar.", "No se ha podido descargar. Revisa la conexión y vuelve a probar.", "Téléchargement impossible. Vérifiez la connexion et réessayez.", "Couldn't download it. Check your connection and try again."}; break;
            case "errInstal": v = new String[]{"No s'ha instal·lat. Torna-ho a provar; si no va, desinstal·la l'app i baixa-la de xoriguer.dev.", "No se ha instalado. Vuelve a probar; si no va, desinstala la app y descárgala de xoriguer.dev.", "Installation échouée. Réessayez ; sinon, désinstallez l'appli et téléchargez-la sur xoriguer.dev.", "It wasn't installed. Try again; if it still fails, uninstall the app and download it from xoriguer.dev."}; break;
            case "buscant": v = new String[]{"Buscant actualitzacions…", "Buscando actualizaciones…", "Recherche de mises à jour…", "Checking for updates…"}; break;
            case "darrera": v = new String[]{"Ja tens la darrera versió ({v}).", "Ya tienes la última versión ({v}).", "Vous avez déjà la dernière version ({v}).", "You already have the latest version ({v})."}; break;
            case "error": v = new String[]{"No s'ha pogut comprovar. Tens connexió a Internet?", "No se ha podido comprobar. ¿Tienes conexión a Internet?", "Vérification impossible. Êtes-vous connecté à Internet ?", "Couldn't check. Are you connected to the Internet?"}; break;
            default: return k;
        }
        return v[i];
    }
}
