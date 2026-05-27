package com.eju.auth.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "qpay")
public class QPayProperties {
    private String baseUrl = "https://merchant-sandbox.qpay.mn/v2";
    private String username = "";
    private String password = "";
    private String invoiceCode = "";
    private String callbackUrl = "";
    private int examFee = 70000;

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String v) { this.baseUrl = v; }
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getInvoiceCode() { return invoiceCode; }
    public void setInvoiceCode(String v) { this.invoiceCode = v; }
    public String getCallbackUrl() { return callbackUrl; }
    public void setCallbackUrl(String v) { this.callbackUrl = v; }
    public int getExamFee() { return examFee; }
    public void setExamFee(int v) { this.examFee = v; }
}
