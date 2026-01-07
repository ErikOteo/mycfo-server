import { useEffect, useState, useCallback } from "react";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "../services/remindersApi";

export function useReminders(userId) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReminders(userId);
      setReminders(data || []);
      setError(null);
    } catch (e) {
      setError(e);
      console.error("Error loading reminders:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (reminderData) => {
    try {
      const newReminder = await createReminder(userId, reminderData);
      setReminders((prev) => [...prev, newReminder]);
      return newReminder;
    } catch (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
  };

  const update = async (reminderId, reminderData) => {
    try {
      const updatedReminder = await updateReminder(
        userId,
        reminderId,
        reminderData
      );
      setReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId ? updatedReminder : reminder
        )
      );
      return updatedReminder;
    } catch (error) {
      console.error("Error updating reminder:", error);
      throw error;
    }
  };

  const remove = async (reminderId) => {
    try {
      await deleteReminder(userId, reminderId);
      setReminders((prev) =>
        prev.filter((reminder) => reminder.id !== reminderId)
      );
    } catch (error) {
      console.error("Error deleting reminder:", error);
      throw error;
    }
  };

  return {
    reminders,
    loading,
    error,
    reload: load,
    create,
    update,
    remove,
  };
}
