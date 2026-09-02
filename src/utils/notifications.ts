
import axios from "axios";

/* =====================================================
   TYPES
===================================================== */

export type NotificationType =
  | "activity"
  | "goal"
  | "device"
  | "system";

export interface CarbonNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  seen: boolean;
  read: boolean;
  relatedId?: string;
  action?: string;
}

export interface NotificationFetchResult {
  notifications: CarbonNotification[];
  unreadCount: number;
}

/* =====================================================
   CONSTANTS
===================================================== */

export const NOTIFICATIONS_STORAGE_KEY =
  "carbontrack_notifications";

export const NOTIFICATIONS_UPDATE_EVENT =
  "carbontrack-notifications-updated";

const isBrowser =
  typeof window !== "undefined";

/* =====================================================
   API BASE URL
===================================================== */

const getApiBaseUrl = (): string => {
  return (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(/\/$/, "");
};

/* =====================================================
   AUTH TOKEN
===================================================== */

const getAuthToken = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  /*
   * CarbonTrack AuthContext stores the token as:
   * carbontrack_token
   *
   * Keep the older keys for compatibility.
   */
  return (
    localStorage.getItem(
      "carbontrack_token"
    ) ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken")
  );
};

const getHeaders = () => {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =====================================================
   EVENT
===================================================== */

const emitNotificationUpdate = () => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      NOTIFICATIONS_UPDATE_EVENT
    )
  );
};

/* =====================================================
   NORMALIZE
===================================================== */

const normalizeNotification = (
  value: unknown
): CarbonNotification | null => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const item =
    value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    typeof item.message !== "string"
  ) {
    return null;
  }

  const seen =
    typeof item.seen === "boolean"
      ? item.seen
      : false;

  const read =
    typeof item.read === "boolean"
      ? item.read
      : seen;

  let type: NotificationType =
    "system";

  if (
    item.type === "activity" ||
    item.type === "goal" ||
    item.type === "device" ||
    item.type === "system"
  ) {
    type = item.type;
  }

  return {
    id: item.id,

    title: item.title,

    message: item.message,

    type,

    createdAt:
      typeof item.createdAt ===
      "string"
        ? item.createdAt
        : new Date().toISOString(),

    seen,

    read,

    relatedId:
      typeof item.relatedId ===
      "string"
        ? item.relatedId
        : undefined,

    action:
      typeof item.action ===
      "string"
        ? item.action
        : undefined,
  };
};

/* =====================================================
   SORT
===================================================== */

const sortNotifications = (
  notifications: CarbonNotification[]
) => {
  return [...notifications].sort(
    (a, b) =>
      new Date(
        b.createdAt
      ).getTime() -
      new Date(
        a.createdAt
      ).getTime()
  );
};

/* =====================================================
   LOCAL CACHE
   -----------------------------------------------------
   Backend is the source of truth.
   localStorage is only a fallback/cache.
===================================================== */

const saveLocalNotifications = (
  notifications: CarbonNotification[]
) => {
  if (!isBrowser) {
    return;
  }

  try {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(
        sortNotifications(
          notifications
        )
      )
    );

    emitNotificationUpdate();
  } catch (error) {
    console.error(
      "CarbonTrack: failed to save notification cache:",
      error
    );
  }
};

/* =====================================================
   GET LOCAL CACHE
===================================================== */

export const getNotifications =
  (): CarbonNotification[] => {
    if (!isBrowser) {
      return [];
    }

    try {
      const raw =
        localStorage.getItem(
          NOTIFICATIONS_STORAGE_KEY
        );

      if (!raw) {
        return [];
      }

      const parsed: unknown =
        JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      const notifications =
        parsed
          .map(normalizeNotification)
          .filter(
            (
              item
            ): item is CarbonNotification =>
              Boolean(item)
          );

      return sortNotifications(
        notifications
      );
    } catch (error) {
      console.error(
        "CarbonTrack: failed to read notification cache:",
        error
      );

      return [];
    }
  };

/* =====================================================
   FETCH BACKEND DATA
   GET /api/notifications
===================================================== */

export const fetchNotificationData =
  async (): Promise<NotificationFetchResult> => {
    try {
      const response =
        await axios.get(
          `${getApiBaseUrl()}/notifications`,
          {
            headers: getHeaders(),
          }
        );

      const backendData =
        response.data?.data;

      const rawNotifications =
        Array.isArray(
          backendData?.notifications
        )
          ? backendData.notifications
          : [];

      const notifications =
        sortNotifications(
          rawNotifications
            .map(
              normalizeNotification
            )
            .filter(
              (
                item
              ): item is CarbonNotification =>
                Boolean(item)
            )
        );

      /*
       * Backend explicitly calculates unreadCount.
       * Use it as the primary value.
       */
      const backendUnreadCount =
        Number(
          backendData?.unreadCount
        );

      const unreadCount =
        Number.isFinite(
          backendUnreadCount
        )
          ? Math.max(
              0,
              backendUnreadCount
            )
          : notifications.filter(
              (notification) =>
                notification.read !==
                true
            ).length;

      saveLocalNotifications(
        notifications
      );

      return {
        notifications,
        unreadCount,
      };
    } catch (error) {
      console.error(
        "CarbonTrack: failed to fetch notifications:",
        error
      );

      const cached =
        getNotifications();

      return {
        notifications: cached,
        unreadCount:
          cached.filter(
            (notification) =>
              notification.read !== true
          ).length,
      };
    }
  };

/* =====================================================
   FETCH NOTIFICATIONS
   -----------------------------------------------------
   Compatibility function used by existing UI.
===================================================== */

export const fetchNotifications =
  async (): Promise<
    CarbonNotification[]
  > => {
    const result =
      await fetchNotificationData();

    return result.notifications;
  };

/* =====================================================
   UNREAD COUNT
===================================================== */

export const getUnreadNotificationCount =
  (): number => {
    return getNotifications().filter(
      (notification) =>
        notification.read !== true
    ).length;
  };

/* =====================================================
   MARK ONE AS READ
   PATCH /api/notifications/:id/read
===================================================== */

export const markNotificationAsRead =
  async (
    id: string
  ): Promise<boolean> => {
    if (!id) {
      return false;
    }

    try {
      await axios.patch(
        `${getApiBaseUrl()}/notifications/${id}/read`,
        {},
        {
          headers: getHeaders(),
        }
      );

      /*
       * Update cache only after backend succeeds.
       */
      const notifications =
        getNotifications();

      saveLocalNotifications(
        notifications.map(
          (notification) =>
            notification.id === id
              ? {
                  ...notification,
                  seen: true,
                  read: true,
                }
              : notification
        )
      );

      return true;
    } catch (error) {
      console.error(
        "CarbonTrack: failed to mark notification as read:",
        error
      );

      return false;
    }
  };

export const markNotificationAsSeen =
  markNotificationAsRead;

/* =====================================================
   MARK ALL AS READ
   PATCH /api/notifications/read-all
===================================================== */

export const markAllNotificationsAsRead =
  async (): Promise<boolean> => {
    try {
      await axios.patch(
        `${getApiBaseUrl()}/notifications/read-all`,
        {},
        {
          headers: getHeaders(),
        }
      );

      /*
       * Update local cache after successful
       * backend operation.
       */
      const notifications =
        getNotifications();

      saveLocalNotifications(
        notifications.map(
          (notification) => ({
            ...notification,
            seen: true,
            read: true,
          })
        )
      );

      return true;
    } catch (error) {
      console.error(
        "CarbonTrack: failed to mark all notifications as read:",
        error
      );

      return false;
    }
  };

export const markAllNotificationsAsSeen =
  markAllNotificationsAsRead;

/* =====================================================
   DELETE ONE
   DELETE /api/notifications/:id
===================================================== */

export const deleteNotification =
  async (
    id: string
  ): Promise<boolean> => {
    if (!id) {
      return false;
    }

    try {
      await axios.delete(
        `${getApiBaseUrl()}/notifications/${id}`,
        {
          headers: getHeaders(),
        }
      );

      const notifications =
        getNotifications();

      saveLocalNotifications(
        notifications.filter(
          (notification) =>
            notification.id !== id
        )
      );

      return true;
    } catch (error) {
      console.error(
        "CarbonTrack: failed to delete notification:",
        error
      );

      return false;
    }
  };

/* =====================================================
   CLEAR ALL
   DELETE /api/notifications
===================================================== */

export const clearNotifications =
  async (): Promise<boolean> => {
    try {
      await axios.delete(
        `${getApiBaseUrl()}/notifications`,
        {
          headers: getHeaders(),
        }
      );

      saveLocalNotifications([]);

      return true;
    } catch (error) {
      console.error(
        "CarbonTrack: failed to clear notifications:",
        error
      );

      return false;
    }
  };

/* =====================================================
   DUPLICATE CHECK
===================================================== */

export const hasNotificationForAction =
  (
    action: string,
    relatedId?: string
  ): boolean => {
    return getNotifications().some(
      (notification) =>
        notification.action === action &&
        (!relatedId ||
          notification.relatedId ===
            relatedId)
    );
  };

/* =====================================================
   LEGACY FRONTEND CREATORS
   -----------------------------------------------------
   Backend now creates real notifications.

   These functions are retained only so older
   imports do not break.

   IMPORTANT:
   They DO NOT create local notifications anymore.
   This prevents duplicate notifications when the
   backend has already created the real notification.
===================================================== */

const createCompatibilityNotification =
  (
    notification: Omit<
      CarbonNotification,
      "id" | "createdAt" | "seen" | "read"
    >
  ): CarbonNotification => {
    return {
      ...notification,

      id: `backend-pending-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      createdAt:
        new Date().toISOString(),

      seen: false,

      read: false,
    };
  };

export const addNotification = (
  notification: Omit<
    CarbonNotification,
    "id" | "createdAt" | "seen" | "read"
  >
): CarbonNotification => {
  /*
   * Compatibility only.
   *
   * Do not save to localStorage because that
   * would create a duplicate of the backend
   * notification.
   */
  return createCompatibilityNotification(
    notification
  );
};

export const addActivityCreatedNotification =
  (activity: any) =>
    addNotification({
      type: "activity",

      title: "Activity added",

      message: `${
        activity?.activityType ||
        "Activity"
      } has been added.`,

      relatedId:
        activity?._id ||
        String(
          activity?.id || ""
        ),

      action:
        "activity-created",
    });

export const addActivityUpdatedNotification =
  (activity: any) =>
    addNotification({
      type: "activity",

      title: "Activity updated",

      message: `${
        activity?.activityType ||
        "Activity"
      } has been successfully updated.`,

      relatedId:
        activity?._id ||
        String(
          activity?.id || ""
        ),

      action:
        "activity-updated",
    });

export const addActivityDeletedNotification =
  (activity?: any) =>
    addNotification({
      type: "activity",

      title: "Activity deleted",

      message: `${
        activity?.activityType ||
        "Activity"
      } has been removed.`,

      relatedId:
        activity?._id ||
        String(
          activity?.id || ""
        ),

      action:
        "activity-deleted",
    });

export const addGoalCreatedNotification =
  (goal: any) =>
    addNotification({
      type: "goal",

      title: "Goal created",

      message: `${
        goal?.title ||
        "Your sustainability goal"
      } has been created successfully.`,

      relatedId:
        goal?._id,

      action:
        "goal-created",
    });

export const addGoalUpdatedNotification =
  (goal: any) =>
    addNotification({
      type: "goal",

      title: "Goal updated",

      message: `${
        goal?.title ||
        "Your sustainability goal"
      } has been updated successfully.`,

      relatedId:
        goal?._id,

      action:
        "goal-updated",
    });

export const addGoalDeletedNotification =
  (goal?: any) =>
    addNotification({
      type: "goal",

      title: "Goal deleted",

      message: `${
        goal?.title ||
        "Your sustainability goal"
      } has been removed.`,

      relatedId:
        goal?._id,

      action:
        "goal-deleted",
    });

export const addGoalCompletedNotification =
  (goal: any) =>
    addNotification({
      type: "goal",

      title: "🎉 Goal completed!",

      message: `Congratulations! You completed "${
        goal?.title ||
        "your sustainability goal"
      }".`,

      relatedId:
        goal?._id,

      action:
        "goal-completed",
    });

/* =====================================================
   GOAL COMPLETION COMPATIBILITY
   -----------------------------------------------------
   Backend handles goal completion notifications.
===================================================== */

export const syncGoalCompletionNotifications =
  (
    _goals: Array<{
      _id: string;
      title?: string;
      status?: string;
      progress?: number;
    }>
  ): void => {
    return;
  };
