package com.anipeak.manga.di;

import com.anipeak.manga.data.api.SupabaseService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;

@ScopeMetadata("javax.inject.Singleton")
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
public final class NetworkModule_ProvideSupabaseServiceFactory implements Factory<SupabaseService> {
  @Override
  public SupabaseService get() {
    return provideSupabaseService();
  }

  public static NetworkModule_ProvideSupabaseServiceFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static SupabaseService provideSupabaseService() {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.provideSupabaseService());
  }

  private static final class InstanceHolder {
    private static final NetworkModule_ProvideSupabaseServiceFactory INSTANCE = new NetworkModule_ProvideSupabaseServiceFactory();
  }
}
