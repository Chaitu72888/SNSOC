package com.snsoc.app.models;

public class GenericResponse {
    private boolean success;
    private String error;
    private String message;

    public boolean isSuccess() { return success; }
    public String getError() { return error; }
    public String getMessage() { return message; }
}
