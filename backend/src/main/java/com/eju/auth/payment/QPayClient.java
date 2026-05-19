package com.eju.auth.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

@Component
public class QPayClient {

    private final QPayProperties props;
    private final ObjectMapper mapper = new ObjectMapper();
    private final RestClient http;

    private volatile String accessToken;
    private volatile Instant tokenExpires = Instant.EPOCH;

    public QPayClient(QPayProperties props) {
        this.props = props;
        this.http = RestClient.builder().baseUrl(props.getBaseUrl()).build();
    }

    private synchronized String token() {
        if (accessToken != null && Instant.now().isBefore(tokenExpires.minusSeconds(30))) {
            return accessToken;
        }
        if (props.getUsername().isBlank() || props.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "QPay credentials are not configured");
        }
        String basic = Base64.getEncoder().encodeToString(
                (props.getUsername() + ":" + props.getPassword()).getBytes(StandardCharsets.UTF_8));
        try {
            JsonNode resp = http.post()
                    .uri("/auth/token")
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + basic)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(JsonNode.class);
            if (resp == null || !resp.hasNonNull("access_token")) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "QPay token response invalid");
            }
            accessToken = resp.get("access_token").asText();
            long expiresIn = resp.path("expires_in").asLong(3600);
            tokenExpires = Instant.now().plusSeconds(expiresIn);
            return accessToken;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "QPay auth failed: " + e.getMessage());
        }
    }

    public JsonNode createInvoice(String senderInvoiceNo, String receiverCode,
                                  String description, int amount, String callbackUrl) {
        Map<String, Object> body = Map.of(
                "invoice_code", props.getInvoiceCode(),
                "sender_invoice_no", senderInvoiceNo,
                "invoice_receiver_code", receiverCode,
                "invoice_description", description,
                "amount", amount,
                "callback_url", callbackUrl
        );
        try {
            return http.post()
                    .uri("/invoice")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "QPay invoice failed: " + e.getMessage());
        }
    }

    /** Returns rows array length > 0 with PAID status when paid. */
    public JsonNode checkPayment(String invoiceId) {
        Map<String, Object> body = Map.of(
                "object_type", "INVOICE",
                "object_id", invoiceId,
                "offset", Map.of("page_number", 1, "page_limit", 100)
        );
        try {
            return http.post()
                    .uri("/payment/check")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "QPay check failed: " + e.getMessage());
        }
    }

    public String stringify(Object obj) {
        try {
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }
}
