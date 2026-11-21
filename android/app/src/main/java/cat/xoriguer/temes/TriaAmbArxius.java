package cat.xoriguer.temes;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Xoriguer · «tria un fitxer» amb Xoriguer Arxius (cat.xoriguer.arxius) si és instal·lat; si no, el selector d'Android de sempre.
 * Còpia idèntica a cada app: l'original és XoriguerAPKs/plantilla/TriaAmbArxius.java (__PKG__ = paquet de l'app).
 *
 * Ús (MainActivity, després de super.onCreate):
 *     getBridge().getWebView().setWebChromeClient(new TriaAmbArxius(getBridge()));
 * I al manifest, perquè Android 11+ deixi veure Arxius:
 *     <queries><package android:name="cat.xoriguer.arxius" /></queries>
 * Les fotos amb càmera (<input capture>) continuen anant per Capacitor.
 */
public class TriaAmbArxius extends BridgeWebChromeClient {
    public static final String ARXIUS = "cat.xoriguer.arxius";
    private final Bridge bridge;
    private final ActivityResultLauncher<Intent> llancador;
    private ValueCallback<Uri[]> pendent;

    public TriaAmbArxius(Bridge bridge) {
        super(bridge);
        this.bridge = bridge;
        llancador = bridge.registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), (r) -> {
            ValueCallback<Uri[]> cb = pendent;
            pendent = null;
            if (cb == null) return;
            Uri[] res = null;
            Intent d = r.getData();
            if (r.getResultCode() == Activity.RESULT_OK && d != null) {
                if (d.getClipData() != null && d.getClipData().getItemCount() > 0) {
                    res = new Uri[d.getClipData().getItemCount()];
                    for (int k = 0; k < res.length; k++) res[k] = d.getClipData().getItemAt(k).getUri();
                } else if (d.getData() != null) {
                    res = new Uri[] { d.getData() };
                }
            }
            cb.onReceiveValue(res);
        });
    }

    /** ".json", "application/json", "image/*"... → tipus MIME vàlids (sense repetits). */
    private static String[] tipus(String[] accept) {
        Set<String> out = new LinkedHashSet<>();
        if (accept != null) for (String a : accept) {
            if (a == null) continue;
            for (String t : a.split(",")) {
                t = t.trim().toLowerCase();
                if (t.isEmpty()) continue;
                if (t.startsWith(".")) {
                    String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(t.substring(1));
                    if (m != null) out.add(m);
                } else if (t.contains("/")) out.add(t);
            }
        }
        if (out.isEmpty()) out.add("*/*");
        return out.toArray(new String[0]);
    }

    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams params) {
        if (params.isCaptureEnabled()) return super.onShowFileChooser(webView, filePathCallback, params);
        String[] t = tipus(params.getAcceptTypes());
        Intent i = new Intent(Intent.ACTION_GET_CONTENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setPackage(ARXIUS);
        i.setType(t.length == 1 ? t[0] : "*/*");
        if (t.length > 1) i.putExtra(Intent.EXTRA_MIME_TYPES, t);
        if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        if (i.resolveActivity(bridge.getContext().getPackageManager()) == null) {
            return super.onShowFileChooser(webView, filePathCallback, params);   // Arxius no és instal·lat (o és una versió sense «tria»)
        }
        if (pendent != null) pendent.onReceiveValue(null);
        pendent = filePathCallback;
        try {
            llancador.launch(i);
            return true;
        } catch (ActivityNotFoundException e) {
            pendent = null;
            return super.onShowFileChooser(webView, filePathCallback, params);
        }
    }
}
