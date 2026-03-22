package com.bottomlord.controller;

import com.bottomlord.entity.Match;
import com.bottomlord.service.MatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * 测试赛事状态回退功能的权限校验和异常处理
 */
class MatchControllerRollbackTest {

    @Mock
    private MatchService matchService;

    @InjectMocks
    private MatchController matchController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRollbackStatus_ServiceLayerValidation() {
        Long matchId = 1L;
        String targetStatus = Match.STATUS_REGISTRATION_CLOSED;

        doNothing().when(matchService).rollbackMatchStatus(matchId, targetStatus);

        assertDoesNotThrow(() -> {
            matchController.rollbackStatus(matchId, targetStatus);
        });

        verify(matchService, times(1)).rollbackMatchStatus(matchId, targetStatus);
    }

    @Test
    void testRollbackStatus_ServiceThrowsIllegalStateException() {
        Long matchId = 1L;
        String targetStatus = Match.STATUS_REGISTRATION_CLOSED;

        doThrow(new IllegalStateException("只能从 ONGOING 状态回退"))
                .when(matchService).rollbackMatchStatus(matchId, targetStatus);

        assertThrows(IllegalStateException.class, () -> {
            matchController.rollbackStatus(matchId, targetStatus);
        });
    }

    @Test
    void testRollbackStatus_ServiceThrowsIllegalArgumentException() {
        Long matchId = 1L;
        String invalidStatus = "INVALID_STATUS";

        doThrow(new IllegalArgumentException("只能回退到 REGISTRATION_CLOSED 或 GROUPING_DRAFT 状态"))
                .when(matchService).rollbackMatchStatus(matchId, invalidStatus);

        assertThrows(IllegalArgumentException.class, () -> {
            matchController.rollbackStatus(matchId, invalidStatus);
        });
    }
}
