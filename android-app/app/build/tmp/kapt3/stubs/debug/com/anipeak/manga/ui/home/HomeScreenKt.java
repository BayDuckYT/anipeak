package com.anipeak.manga.ui.home;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000(\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\u001a$\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00010\u0005H\u0007\u001a*\u0010\u0007\u001a\u00020\u00012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00030\b2\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00010\u0005H\u0007\u001a&\u0010\t\u001a\u00020\u00012\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00010\u00052\b\b\u0002\u0010\n\u001a\u00020\u000bH\u0007\u001a\b\u0010\f\u001a\u00020\u0001H\u0007\u001a$\u0010\r\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0012\u0010\u0004\u001a\u000e\u0012\u0004\u0012\u00020\u0006\u0012\u0004\u0012\u00020\u00010\u0005H\u0007\u00a8\u0006\u000e"}, d2 = {"HeroSection", "", "series", "Lcom/anipeak/manga/data/model/Series;", "onSeriesClick", "Lkotlin/Function1;", "", "HomeContent", "", "HomeScreen", "viewModel", "Lcom/anipeak/manga/ui/home/HomeViewModel;", "HomeTopBar", "TrendingListItem", "app_debug"})
public final class HomeScreenKt {
    
    @androidx.compose.runtime.Composable()
    public static final void HomeScreen(@org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onSeriesClick, @org.jetbrains.annotations.NotNull()
    com.anipeak.manga.ui.home.HomeViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void HomeTopBar() {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void HomeContent(@org.jetbrains.annotations.NotNull()
    java.util.List<com.anipeak.manga.data.model.Series> series, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onSeriesClick) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void HeroSection(@org.jetbrains.annotations.NotNull()
    com.anipeak.manga.data.model.Series series, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onSeriesClick) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void TrendingListItem(@org.jetbrains.annotations.NotNull()
    com.anipeak.manga.data.model.Series series, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onSeriesClick) {
    }
}