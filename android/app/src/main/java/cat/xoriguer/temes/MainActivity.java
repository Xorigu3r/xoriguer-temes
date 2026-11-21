package cat.xoriguer.temes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TemesPont.class);   // model, apps, desar i aplicar el tema (www/js/plataforma.js)
        super.onCreate(savedInstanceState);
        XoriguerObliga.comprova(this, "temes");
        // «Tria un fitxer» (fotos per als fons) amb Xoriguer Arxius si és instal·lat (XoriguerAPKs/plantilla/TriaAmbArxius.java)
        getBridge().getWebView().setWebChromeClient(new TriaAmbArxius(getBridge()));
    }
}
