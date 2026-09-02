
import api from "./api";

export interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  sustainabilityScore: number;
  totalCO2: number;
  activitiesLogged: number;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  success: boolean;

  data: {
    leaderboard: LeaderboardUser[];

    totalUsers: number;

    currentUser:
      | LeaderboardUser
      | null;
  };
}

export const getLeaderboard =
  async (): Promise<LeaderboardResponse> => {
    const response =
      await api.get<LeaderboardResponse>(
        "/leaderboard"
      );

    return response.data;
  };
