package com.bottomlord.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bottomlord.entity.UserRole;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户-角色关联映射器
 *
 * @author Gemini
 */
@Mapper
public interface UserRoleMapper extends BaseMapper<UserRole> {
}
