package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.Role;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色映射器
 *
 * @author Gemini
 */
@Mapper
public interface RoleMapper extends BaseMapper<Role> {

    @Select("SELECT r.* FROM role r " +
            "JOIN user_role ur ON r.id = ur.role_id " +
            "WHERE ur.user_id = #{userId}")
    List<Role> selectRolesByUserId(@Param("userId") Long userId);
}
