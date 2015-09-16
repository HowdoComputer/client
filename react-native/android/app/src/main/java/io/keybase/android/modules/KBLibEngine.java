package io.keybase.android.modules;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import static go.keybase.Keybase.WriteB64;
import static go.keybase.Keybase.ReadB64;

public class KBLibEngine extends ReactContextBaseJavaModule {

    private static final String NAME = KBLibEngine.class.getName();
    private static final String RPC_EVENT_NAME = "RPC";

    private class ReadFromKBLib implements Runnable {
        private final ReactApplicationContext reactContext;

        public ReadFromKBLib(ReactApplicationContext reactContext) {
            this.reactContext = reactContext;
        }

        @Override
        public void run() {
            ReadB64();

            WritableMap params = Arguments.createMap();
            params.putNull("error");
            params.putString("val", "something");

            reactContext
              .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
              .emit(KBLibEngine.RPC_EVENT_NAME, params);

            // loop forever
            this.run();
        }
    }

    public KBLibEngine(ReactApplicationContext reactContext) {
        super(reactContext);

        Executor executor = Executors.newSingleThreadExecutor();
        executor.execute(new ReadFromKBLib(reactContext));
    }

    public String getName() {
        return "KBLibEngine";
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        constants.put("eventName", RPC_EVENT_NAME);
        return constants;
    }

    @ReactMethod
    public void runWithData(String data) {
        WriteB64(data);
    }
}
