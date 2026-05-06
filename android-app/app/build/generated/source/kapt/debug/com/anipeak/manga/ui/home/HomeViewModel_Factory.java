package com.anipeak.manga.ui.home;

import com.anipeak.manga.data.api.SupabaseService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava"
})
public final class HomeViewModel_Factory implements Factory<HomeViewModel> {
  private final Provider<SupabaseService> apiProvider;

  public HomeViewModel_Factory(Provider<SupabaseService> apiProvider) {
    this.apiProvider = apiProvider;
  }

  @Override
  public HomeViewModel get() {
    return newInstance(apiProvider.get());
  }

  public static HomeViewModel_Factory create(Provider<SupabaseService> apiProvider) {
    return new HomeViewModel_Factory(apiProvider);
  }

  public static HomeViewModel newInstance(SupabaseService api) {
    return new HomeViewModel(api);
  }
}
