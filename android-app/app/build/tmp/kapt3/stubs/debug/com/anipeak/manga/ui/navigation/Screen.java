package com.anipeak.manga.ui.navigation;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b6\u0018\u00002\u00020\u0001:\t\u0007\b\t\n\u000b\f\r\u000e\u000fB\u000f\b\u0004\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006\u0082\u0001\t\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u00a8\u0006\u0019"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen;", "", "route", "", "(Ljava/lang/String;)V", "getRoute", "()Ljava/lang/String;", "Community", "Detail", "Discover", "Home", "Library", "Premium", "Profile", "Reader", "Search", "Lcom/anipeak/manga/ui/navigation/Screen$Community;", "Lcom/anipeak/manga/ui/navigation/Screen$Detail;", "Lcom/anipeak/manga/ui/navigation/Screen$Discover;", "Lcom/anipeak/manga/ui/navigation/Screen$Home;", "Lcom/anipeak/manga/ui/navigation/Screen$Library;", "Lcom/anipeak/manga/ui/navigation/Screen$Premium;", "Lcom/anipeak/manga/ui/navigation/Screen$Profile;", "Lcom/anipeak/manga/ui/navigation/Screen$Reader;", "Lcom/anipeak/manga/ui/navigation/Screen$Search;", "app_debug"})
public abstract class Screen {
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String route = null;
    
    private Screen(java.lang.String route) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getRoute() {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Community;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Community extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Community INSTANCE = null;
        
        private Community() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0018\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0000\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006\u00a8\u0006\u0007"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Detail;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "createRoute", "", "id", "", "app_debug"})
    public static final class Detail extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Detail INSTANCE = null;
        
        private Detail() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String createRoute(int id) {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Discover;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Discover extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Discover INSTANCE = null;
        
        private Discover() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Home;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Home extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Home INSTANCE = null;
        
        private Home() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Library;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Library extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Library INSTANCE = null;
        
        private Library() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Premium;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Premium extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Premium INSTANCE = null;
        
        private Premium() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Profile;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Profile extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Profile INSTANCE = null;
        
        private Profile() {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001a\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u0016\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u0006\u00a8\u0006\b"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Reader;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "createRoute", "", "seriesId", "", "chapterId", "app_debug"})
    public static final class Reader extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Reader INSTANCE = null;
        
        private Reader() {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String createRoute(int seriesId, int chapterId) {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\f\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u00c6\u0002\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002\u00a8\u0006\u0003"}, d2 = {"Lcom/anipeak/manga/ui/navigation/Screen$Search;", "Lcom/anipeak/manga/ui/navigation/Screen;", "()V", "app_debug"})
    public static final class Search extends com.anipeak.manga.ui.navigation.Screen {
        @org.jetbrains.annotations.NotNull()
        public static final com.anipeak.manga.ui.navigation.Screen.Search INSTANCE = null;
        
        private Search() {
        }
    }
}