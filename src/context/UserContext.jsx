import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  getUsers, addUser as storageAddUser, deleteUser as storageDeleteUser,
  updateUser as storageUpdateUser, getUserCascadeCounts,
  getCurrentUserId, setCurrentUserId, migrateLegacyData,
  subscribeDataChange,
} from '../utils/storage.js'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  // Run legacy migration once before any state initialisation reads localStorage.
  useEffect(() => { migrateLegacyData() }, [])

  const [users, setUsers] = useState(() => {
    migrateLegacyData()
    return getUsers()
  })
  const [currentUserId, setCurrentUserIdState] = useState(() => getCurrentUserId())

  const currentUser = users.find(u => u.id === currentUserId) || null

  const refreshUsers = useCallback(() => setUsers(getUsers()), [])

  // Pick up remote sync pulls and any cross-screen mutations.
  useEffect(() => subscribeDataChange(refreshUsers), [refreshUsers])

  const createUser = useCallback(({ name, avatar }) => {
    const user = storageAddUser({ name, avatar })
    refreshUsers()
    return user
  }, [refreshUsers])

  const editUser = useCallback((userId, patch) => {
    const updated = storageUpdateUser(userId, patch)
    refreshUsers()
    return updated
  }, [refreshUsers])

  const removeUser = useCallback((userId) => {
    storageDeleteUser(userId)
    refreshUsers()
    if (currentUserId === userId) setCurrentUserIdState(null)
  }, [currentUserId, refreshUsers])

  const userCascadeCounts = useCallback(
    (userId) => getUserCascadeCounts(userId),
    []
  )

  const selectUser = useCallback((userId) => {
    setCurrentUserId(userId)
    setCurrentUserIdState(userId)
  }, [])

  const clearCurrentUser = useCallback(() => {
    setCurrentUserId(null)
    setCurrentUserIdState(null)
  }, [])

  const value = {
    users,
    currentUser,
    currentUserId,
    createUser,
    editUser,
    removeUser,
    selectUser,
    clearCurrentUser,
    refreshUsers,
    userCascadeCounts,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>')
  return ctx
}
