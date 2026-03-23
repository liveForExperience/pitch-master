package com.bottomlord.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SettlementRequest {
    private BigDecimal totalCost;
    private Boolean publish;
    private List<SettlementRegistrationDTO> registrations;

    @Data
    public static class SettlementRegistrationDTO {
        private Long playerId;
        private BigDecimal paymentAmount;
        private Boolean isExempt;
    }
}
