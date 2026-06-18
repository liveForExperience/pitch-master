package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.dto.UserSearchVO;
import com.bottomlord.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户表 Mapper 接口
 *
 * @author Gemini
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    @Select("<script>" +
            "SELECT u.id, u.username, u.real_name, u.status, p.nickname AS player_nickname " +
            "FROM `user` u " +
            "LEFT JOIN player p ON p.user_id = u.id AND p.status = 1 " +
            "WHERE u.status = 1 " +
            "<if test='keyword != null and keyword != \"\"'>" +
            "AND (u.username LIKE CONCAT('%', #{keyword}, '%') " +
            "OR u.real_name LIKE CONCAT('%', #{keyword}, '%') " +
            "OR p.nickname LIKE CONCAT('%', #{keyword}, '%')) " +
            "</if>" +
            "ORDER BY u.id DESC " +
            "LIMIT #{offset}, #{pageSize}" +
            "</script>")
    List<UserSearchVO> searchUsersPage(@Param("keyword") String keyword,
                                       @Param("offset") int offset,
                                       @Param("pageSize") int pageSize);

    @Select("<script>" +
            "SELECT COUNT(DISTINCT u.id) " +
            "FROM `user` u " +
            "LEFT JOIN player p ON p.user_id = u.id AND p.status = 1 " +
            "WHERE u.status = 1 " +
            "<if test='keyword != null and keyword != \"\"'>" +
            "AND (u.username LIKE CONCAT('%', #{keyword}, '%') " +
            "OR u.real_name LIKE CONCAT('%', #{keyword}, '%') " +
            "OR p.nickname LIKE CONCAT('%', #{keyword}, '%')) " +
            "</if>" +
            "</script>")
    long countSearchUsers(@Param("keyword") String keyword);
}
