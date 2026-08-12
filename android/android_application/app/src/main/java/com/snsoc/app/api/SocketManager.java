package com.snsoc.app.api;

import android.util.Log;
import com.snsoc.app.utils.Constants;

import java.net.URISyntaxException;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class SocketManager {

    private static final String TAG = "SocketManager";
    private static SocketManager instance;
    private Socket mSocket;

    private SocketManager() {
        try {
            IO.Options opts = new IO.Options();
            opts.forceNew = true;
            opts.reconnection = true;
            mSocket = IO.socket(Constants.BASE_URL, opts);
        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket URI syntax error: " + e.getMessage());
        }
    }

    public static synchronized SocketManager getInstance() {
        if (instance == null) {
            instance = new SocketManager();
        }
        return instance;
    }

    public void connect() {
        if (mSocket != null && !mSocket.connected()) {
            mSocket.connect();
        }
    }

    public void disconnect() {
        if (mSocket != null && mSocket.connected()) {
            mSocket.disconnect();
        }
    }

    public void on(String event, Emitter.Listener listener) {
        if (mSocket != null) {
            mSocket.on(event, listener);
        }
    }

    public void off(String event, Emitter.Listener listener) {
        if (mSocket != null) {
            mSocket.off(event, listener);
        }
    }

    public boolean isConnected() {
        return mSocket != null && mSocket.connected();
    }
}
