package com.snsoc.app.models;

public class LoginResponse {
    private boolean success;
    private String message;
    private String error;
    private User user;

    public static class User {
        private int id;
        private String name;

        public int getId() { return id; }
        public String getName() { return name; }
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public String getError() { return error; }
    public User getUser() { return user; }
}
