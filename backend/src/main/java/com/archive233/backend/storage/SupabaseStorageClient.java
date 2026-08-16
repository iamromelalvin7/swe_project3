package com.archive233.backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Talks to Supabase Storage's REST API directly. The service-role key is
 * server-side only (hard rule 10) — never sent to the browser.
 */
@Component
public class SupabaseStorageClient {

    private final RestClient restClient;
    private final String bucket;
    private final String publicUrlBase;

    public SupabaseStorageClient(RestClient.Builder builder,
                                  @Value("${app.supabase.url}") String supabaseUrl,
                                  @Value("${app.supabase.service-role-key}") String serviceRoleKey,
                                  @Value("${app.supabase.bucket}") String bucket) {
        this.restClient = builder
            .baseUrl(supabaseUrl + "/storage/v1")
            .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
            .defaultHeader("apikey", serviceRoleKey)
            .build();
        this.bucket = bucket;
        this.publicUrlBase = supabaseUrl + "/storage/v1/object/public/" + bucket + "/";
    }

    /**
     * Uploads bytes to {@code path} within the configured bucket and returns
     * the resulting public URL.
     */
    public String upload(String path, byte[] bytes, MediaType contentType) {
        restClient.post()
            .uri("/object/{bucket}/{path}", bucket, path)
            .contentType(contentType)
            .body(bytes)
            .retrieve()
            .toBodilessEntity();
        return publicUrlBase + path;
    }
}
