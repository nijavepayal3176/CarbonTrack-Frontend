
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Stack from "@mui/material/Stack";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

import api from "../services/api";

/* =====================================================
   TYPES
===================================================== */

interface LeaderboardUser {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  totalCO2: number;
  activityCount: number;
  sustainabilityScore: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
  topThree: LeaderboardUser[];
  currentUser: LeaderboardUser | null;
  totalUsers: number;
  activeUsers: number;
}

interface ApiLeaderboardResponse {
  success?: boolean;
  message?: string;
  data?: LeaderboardResponse;
}

interface RawLeaderboardUser {
  rank?: number | string;
  userId?: string;
  name?: string;
  email?: string;
  avatar?: string;
  _id?: string;
  id?: string;
  totalCO2?: number | string;
  activityCount?: number | string;
  sustainabilityScore?: number | string;
  isCurrentUser?: boolean;
}

/* =====================================================
   HELPERS
===================================================== */

const toNumber = (
  value: unknown,
  fallback = 0
): number => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const normalizeUser = (
  user: RawLeaderboardUser
): LeaderboardUser => {
  return {
    rank: toNumber(user.rank, 0),

    userId:
      user.userId ||
      user._id ||
      user.id ||
      "",

    name:
      typeof user.name === "string" &&
      user.name.trim()
        ? user.name.trim()
        : "CarbonTrack User",

    email:
      typeof user.email === "string"
        ? user.email
        : "",

    avatar:
      typeof user.avatar === "string"
        ? user.avatar
        : "",

    totalCO2: toNumber(
      user.totalCO2
    ),

    activityCount: toNumber(
      user.activityCount
    ),

    sustainabilityScore: toNumber(
      user.sustainabilityScore
    ),

    isCurrentUser:
      Boolean(user.isCurrentUser),
  };
};

const normalizeLeaderboardData = (
  value: unknown
): LeaderboardResponse => {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return {
      leaderboard: [],
      topThree: [],
      currentUser: null,
      totalUsers: 0,
      activeUsers: 0,
    };
  }

  const raw =
    value as Partial<LeaderboardResponse> & {
      leaderboard?: RawLeaderboardUser[];
      topThree?: RawLeaderboardUser[];
      currentUser?: RawLeaderboardUser | null;
    };

  const leaderboard = Array.isArray(
    raw.leaderboard
  )
    ? raw.leaderboard.map((user) =>
        normalizeUser(user)
      )
    : [];

  const topThree = Array.isArray(
    raw.topThree
  )
    ? raw.topThree.map((user) =>
        normalizeUser(user)
      )
    : leaderboard
        .filter(
          (user) =>
            user.rank >= 1 &&
            user.rank <= 3
        )
        .slice(0, 3);

  const currentUser =
    raw.currentUser &&
    typeof raw.currentUser === "object"
      ? normalizeUser(
          raw.currentUser
        )
      : null;

  return {
    leaderboard,
    topThree,
    currentUser,

    totalUsers: toNumber(
      raw.totalUsers
    ),

    activeUsers: toNumber(
      raw.activeUsers
    ),
  };
};

const getInitials = (
  name: string
): string => {
  if (!name?.trim()) {
    return "CT";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getRankColor = (
  rank: number
): string => {
  if (rank === 1) {
    return "#F59E0B";
  }

  if (rank === 2) {
    return "#64748B";
  }

  if (rank === 3) {
    return "#B45309";
  }

  return "#64748B";
};

const getRankBackground = (
  rank: number
): string => {
  if (rank === 1) {
    return "linear-gradient(135deg,#FFF9E6,#FFF0B8)";
  }

  if (rank === 2) {
    return "linear-gradient(135deg,#F8FAFC,#E8EDF3)";
  }

  if (rank === 3) {
    return "linear-gradient(135deg,#FFF7ED,#FED7AA)";
  }

  return "#F8FAFC";
};

/* =====================================================
   COMPONENT
===================================================== */

const Leaderboard = () => {
  const [data, setData] =
    useState<LeaderboardResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const requestIdRef =
    useRef(0);

  /* ===================================================
     FETCH LEADERBOARD
  =================================================== */

  const fetchLeaderboard =
    useCallback(
      async (
        searchValue = "",
        isInitialLoad = false
      ) => {
        const requestId =
          ++requestIdRef.current;

        const cleanSearch =
          searchValue.trim();

        try {
          setError("");

          if (isInitialLoad) {
            setLoading(true);
          } else if (cleanSearch) {
            setSearching(true);
          } else {
            setLoading(true);
          }

          const response =
            await api.get<ApiLeaderboardResponse>(
              "/leaderboard",
              {
                params: {
                  limit: 100,

                  ...(cleanSearch
                    ? {
                        search:
                          cleanSearch,
                      }
                    : {}),
                },
              }
            );

          console.log(
            "🏆 Leaderboard API:",
            response.data
          );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          if (
            response.data?.success ===
            false
          ) {
            setError(
              response.data.message ||
                "Unable to load leaderboard."
            );

            return;
          }

          const responseData =
            normalizeLeaderboardData(
              response.data?.data
            );

          setData(responseData);
        } catch (err) {
          console.error(
            "❌ Leaderboard fetch error:",
            err
          );

          if (
            requestId ===
            requestIdRef.current
          ) {
            setError(
              "Unable to load leaderboard. Please try again."
            );
          }
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
            setSearching(false);
          }
        }
      },
      []
    );

  /* ===================================================
     INITIAL LOAD
  =================================================== */

  useEffect(() => {
    fetchLeaderboard("", true);
  }, [fetchLeaderboard]);

  /* ===================================================
     DEBOUNCED SEARCH
  =================================================== */

  useEffect(() => {
    if (searchInput.trim() === "") {
      if (search !== "") {
        setSearch("");
        fetchLeaderboard("");
      }

      return;
    }

    const timer =
      window.setTimeout(() => {
        const cleanSearch =
          searchInput.trim();

        setSearch(cleanSearch);

        fetchLeaderboard(
          cleanSearch
        );
      }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    searchInput,
    search,
    fetchLeaderboard,
  ]);

  /* ===================================================
     DATA
  =================================================== */

  const currentUser =
    data?.currentUser || null;

  const topThree =
    data?.topThree || [];

  const leaderboard =
    data?.leaderboard || [];

  /* ===================================================
     MAX CO2
  =================================================== */

  const maxCO2 = useMemo(() => {
    if (leaderboard.length === 0) {
      return 1;
    }

    const values =
      leaderboard.map((user) =>
        toNumber(user.totalCO2)
      );

    const max = Math.max(
      ...values,
      1
    );

    return Number.isFinite(max)
      ? max
      : 1;
  }, [leaderboard]);

  /* ===================================================
     SEARCH HANDLER
  =================================================== */

  const handleSearch = () => {
    const clean =
      searchInput.trim();

    setSearch(clean);

    fetchLeaderboard(clean);
  };

  /* ===================================================
     CLEAR SEARCH
  =================================================== */

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    fetchLeaderboard("");
  };

  /* ===================================================
     LOADING SCREEN
  =================================================== */

  if (loading && !data) {
    return (
      <Box
        sx={{
          minHeight:
            "calc(100vh - 70px)",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "linear-gradient(180deg,#F8FAFC,#F5F8F6)",

          px: 2,
        }}
      >
        <Stack
          spacing={2}
          sx={{
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,

              borderRadius: 3,

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              background:
                "linear-gradient(135deg,#168A52,#08763E)",

              boxShadow:
                "0 14px 35px rgba(20,150,83,0.20)",
            }}
          >
            <EmojiEventsOutlinedIcon
              sx={{
                color: "#FFFFFF",
                fontSize: 32,
              }}
            />
          </Box>

          <CircularProgress
            size={28}
            thickness={4}
            sx={{
              color: "#149653",
            }}
          />

          <Typography
            sx={{
              color: "#64748B",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Loading real leaderboard...
          </Typography>
        </Stack>
      </Box>
    );
  }

  /* ===================================================
     MAIN UI
  =================================================== */

  return (
    <Box
      sx={{
        minHeight:
          "calc(100vh - 70px)",

        background:
          "linear-gradient(180deg,#F8FAFC 0%,#F5F8F6 100%)",

        px: {
          xs: 1.5,
          sm: 2.5,
          md: 3,
          lg: 4,
        },

        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* HEADER */}

        <Stack
          direction={{
            xs: "column",
            lg: "row",
          }}
          spacing={2.5}
          sx={{
            alignItems: {
              xs: "stretch",
              lg: "center",
            },

            justifyContent:
              "space-between",

            mb: 3,
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1.3}
              sx={{
                mb: 0.7,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,

                  flexShrink: 0,

                  borderRadius: 2.8,

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "linear-gradient(135deg,#E9EFE2 0%,#A0CD9C 100%)",

                  boxShadow:
                    "0 10px 24px rgba(190,145,45,0.18)",

                  transition:
                    "all 0.25s ease",

                  "&:hover": {
                    transform:
                      "translateY(-2px) rotate(-3deg)",

                    boxShadow:
                      "0 16px 32px rgba(190,145,45,0.25)",
                  },
                }}
              >
                <WorkspacePremiumOutlinedIcon
                  sx={{
                    color:
                      "#111827",

                    fontSize: 26,
                  }}
                />
              </Box>

              <Typography
                component="h1"
                sx={{
                  fontSize: {
                    xs: 26,
                    md: 32,
                  },

                  fontWeight: 900,

                  color:
                    "#111827",

                  letterSpacing:
                    "-1px",
                }}
              >
                Leaderboard
              </Typography>
            </Stack>

            <Typography
              sx={{
                color:
                  "#64748B",

                fontSize: 14,

                maxWidth: 690,

                lineHeight: 1.7,
              }}
            >
              Discover the CarbonTrack
              community leaders based on
              real activity records,
              calculated CO₂ emissions,
              and sustainability performance.
            </Typography>
          </Box>

          {/* SEARCH */}

          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: {
                xs: "100%",
                lg: "auto",
              },
            }}
          >
            <TextField
              value={searchInput}
              onChange={(event) => {
                setSearchInput(
                  event.target.value
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="Search users..."
              size="small"
              fullWidth
              sx={{
                width: {
                  xs: "100%",
                  sm: 290,
                },

                "& .MuiOutlinedInput-root": {
                  minHeight: 46,

                  borderRadius: 2.8,

                  background:
                    "#FFFFFF",

                  transition:
                    "all 0.2s ease",

                  "& fieldset": {
                    borderColor:
                      "#E2E8F0",
                  },

                  "&:hover": {
                    boxShadow:
                      "0 5px 18px rgba(15,23,42,0.06)",
                  },

                  "&:hover fieldset": {
                    borderColor:
                      "#AFC2B6",
                  },

                  "&.Mui-focused": {
                    boxShadow:
                      "0 0 0 4px rgba(20,150,83,0.09)",
                  },

                  "&.Mui-focused fieldset": {
                    borderColor:
                      "#149653",

                    borderWidth:
                      1.5,
                  },
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon
                        sx={{
                          fontSize: 21,

                          color:
                            searchInput
                              ? "#149653"
                              : "#94A3B8",

                          transition:
                            "color 0.2s ease",
                        }}
                      />
                    </InputAdornment>
                  ),

                  endAdornment:
                    searchInput ? (
                      <InputAdornment position="end">
                        {searching ? (
                          <CircularProgress
                            size={17}
                            thickness={4}
                            sx={{
                              color:
                                "#149653",
                            }}
                          />
                        ) : (
                          <IconButton
                            size="small"
                            onClick={
                              handleClearSearch
                            }
                            aria-label="Clear search"
                            sx={{
                              color:
                                "#94A3B8",

                              "&:hover": {
                                color:
                                  "#149653",

                                background:
                                  "#EAF8F0",
                              },
                            }}
                          >
                            <CloseOutlinedIcon
                              sx={{
                                fontSize: 18,
                              }}
                            />
                          </IconButton>
                        )}
                      </InputAdornment>
                    ) : undefined,
                },
              }}
            />

            <Tooltip title="Search users">
              <span>
                <IconButton
                  onClick={
                    handleSearch
                  }
                  disabled={searching}
                  aria-label="Search users"
                  sx={{
                    width: 46,
                    height: 46,

                    flexShrink: 0,

                    border:
                      "1px solid #E2E8F0",

                    background:
                      "#FFFFFF",

                    borderRadius: 2.8,

                    color:
                      "#149653",

                    transition:
                      "all 0.2s ease",

                    "&:hover": {
                      background:
                        "#EFFAF4",

                      borderColor:
                        "#BFDCCA",

                      transform:
                        "translateY(-2px)",

                      boxShadow:
                        "0 8px 20px rgba(20,150,83,0.14)",
                    },

                    "&.Mui-disabled": {
                      color:
                        "#CBD5E1",
                    },
                  }}
                >
                  <SearchOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* ERROR */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2.5,
            }}
          >
            {error}
          </Alert>
        )}

        {/* YOUR REAL RANK SPOTLIGHT */}

        {currentUser && (
          <Card
            elevation={0}
            sx={{
              mb: 3,

              borderRadius: 4,

              border:
                "1px solid #D9EADF",

              overflow:
                "hidden",

              position:
                "relative",

              background:
                "linear-gradient(135deg,#FFFFFF 0%,#F0FAF4 100%)",

              boxShadow:
                "0 12px 35px rgba(15,23,42,0.06)",

              transition:
                "all 0.25s ease",

              "&:hover": {
                transform:
                  "translateY(-2px)",

                boxShadow:
                  "0 18px 45px rgba(15,23,42,0.09)",
              },
            }}
          >
            <Box
              sx={{
                position:
                  "absolute",

                width: 220,
                height: 220,

                borderRadius:
                  "50%",

                right: -80,
                top: -110,

                background:
                  "rgba(20,150,83,0.07)",

                pointerEvents:
                  "none",
              }}
            />

            <Box
              sx={{
                position:
                  "absolute",

                width: 100,
                height: 100,

                borderRadius:
                  "50%",

                right: 100,
                bottom: -65,

                background:
                  "rgba(20,150,83,0.04)",

                pointerEvents:
                  "none",
              }}
            />

            <CardContent
              sx={{
                p: {
                  xs: 2,
                  sm: 2.5,
                  md: 3,
                },

                "&:last-child": {
                  pb: {
                    xs: 2,
                    sm: 2.5,
                    md: 3,
                  },
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "stretch",
                    md: "center",
                  },
                }}
              >

<Stack
  direction="row"
  spacing={1.5}
  sx={{
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  }}
>

                  <Avatar
                    src={
                      currentUser.avatar ||
                      undefined
                    }
                    sx={{
                      width: 60,
                      height: 60,

                      flexShrink: 0,

                      background:
                        "linear-gradient(135deg,#159653,#08763E)",

                      fontWeight: 900,

                      fontSize: 17,

                      border:
                        "3px solid #FFFFFF",

                      boxShadow:
                        "0 7px 20px rgba(20,150,83,0.20)",
                    }}
                  >
                    {getInitials(
                      currentUser.name
                    )}
                  </Avatar>

                  <Box
                    sx={{
                      minWidth: 0,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={0.8}
                      sx={{
                        alignItems:
                          "center",

                        flexWrap:
                          "wrap",
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 900,

                          fontSize: 18,

                          color:
                            "#162033",
                        }}
                      >
                        Your Rank
                      </Typography>

                      <Chip
                        icon={
                          <MilitaryTechOutlinedIcon />
                        }
                        label={`#${currentUser.rank}`}
                        size="small"
                        sx={{
                          height: 27,

                          fontWeight: 900,

                          color:
                            "#087B41",

                          background:
                            "#DFF5E8",

                          border:
                            "1px solid #C5E8D2",

                          "& .MuiChip-icon": {
                            color:
                              "#087B41",
                          },
                        }}
                      />
                    </Stack>

                    <Typography
                      sx={{
                        mt: 0.45,

                        color:
                          "#64748B",

                        fontSize: 13,

                        overflow:
                          "hidden",

                        textOverflow:
                          "ellipsis",

                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {currentUser.name}
                      {" • "}
                      {currentUser.totalCO2.toFixed(
                        2
                      )}{" "}
                      kg CO₂ recorded
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  direction="row"
                  spacing={{
                    xs: 2.5,
                    sm: 4,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 10,

                        fontWeight: 800,

                        color:
                          "#94A3B8",

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.7px",
                      }}
                    >
                      Activities
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,

                        fontSize: 22,

                        fontWeight: 900,

                        color:
                          "#162033",
                      }}
                    >
                      {
                        currentUser.activityCount
                      }
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 10,

                        fontWeight: 800,

                        color:
                          "#94A3B8",

                        textTransform:
                          "uppercase",

                        letterSpacing:
                          "0.7px",
                      }}
                    >
                      Score
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,

                        fontSize: 22,

                        fontWeight: 900,

                        color:
                          "#149653",
                      }}
                    >
                      {
                        currentUser.sustainabilityScore
                      }
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* STAT CARDS */}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,1fr)",
              xl: "repeat(4,1fr)",
            },

            gap: 2,

            mb: 3,
          }}
        >
          {[
            {
              title:
                "Community Members",

              value:
                data?.totalUsers || 0,

              icon:
                GroupsOutlinedIcon,

              accent:
                "#5B22D6",

              bg:
                "#F3EEFF",
            },

            {
              title:
                "Active Members",

              value:
                data?.activeUsers || 0,

              icon:
                PersonOutlineOutlinedIcon,

              accent:
                "#149653",

              bg:
                "#EAF8F0",
            },

            {
              title:
                "Top Performer",

              value:
                topThree[0]
                  ?.name || "—",

              icon:
                WorkspacePremiumOutlinedIcon,

              accent:
                "#D97706",

              bg:
                "#FFF7E8",
            },

            {
              title:
                "Your Rank",

              value:
                currentUser
                  ? `#${currentUser.rank}`
                  : "—",

              icon:
                TrendingDownOutlinedIcon,

              accent:
                "#087B41",

              bg:
                "#EAF8F0",
            },
          ].map((stat) => {
            const Icon =
              stat.icon;

            return (
              <Card
                key={stat.title}
                elevation={0}
                sx={{
                  borderRadius: 3.2,

                  border:
                    "1px solid #E7ECF0",

                  background:
                    "#FFFFFF",

                  boxShadow:
                    "0 7px 24px rgba(15,23,42,0.04)",

                  transition:
                    "all 0.25s ease",

                  position:
                    "relative",

                  overflow:
                    "hidden",

                  "&::after": {
                    content:
                      '""',

                    position:
                      "absolute",

                    left: 0,
                    bottom: 0,

                    width: "100%",
                    height: 3,

                    background:
                      stat.accent,

                    transform:
                      "scaleX(0)",

                    transformOrigin:
                      "left",

                    transition:
                      "transform 0.25s ease",
                  },

                  "&:hover": {
                    transform:
                      "translateY(-5px)",

                    boxShadow:
                      "0 18px 38px rgba(15,23,42,0.10)",

                    borderColor:
                      "#D8E3DD",

                    "&::after": {
                      transform:
                        "scaleX(1)",
                    },
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 2.2,

                    "&:last-child": {
                      pb: 2.2,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.4}
                    sx={{
                      alignItems:
                        "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,

                        flexShrink: 0,

                        borderRadius: 2.3,

                        display: "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        background:
                          stat.bg,

                        transition:
                          "transform 0.25s ease",
                      }}
                    >
                      <Icon
                        sx={{
                          color:
                            stat.accent,

                          fontSize: 23,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          color:
                            "#94A3B8",

                          fontSize: 10,

                          fontWeight: 800,

                          textTransform:
                            "uppercase",

                          letterSpacing:
                            "0.6px",
                        }}
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.25,

                          fontSize:
                            stat.title ===
                            "Top Performer"
                              ? 15
                              : 23,

                          fontWeight: 900,

                          color:
                            "#162033",

                          whiteSpace:
                            "nowrap",

                          overflow:
                            "hidden",

                          textOverflow:
                            "ellipsis",

                          maxWidth:
                            210,
                        }}
                      >
                        {stat.value}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* TOP 3 */}

        {topThree.length > 0 && (
          <Card
            elevation={0}
            sx={{
              mb: 3,

              borderRadius: 4,

              border:
                "1px solid #E5EAF0",

              background:
                "#FFFFFF",

              overflow:
                "hidden",

              boxShadow:
                "0 10px 30px rgba(15,23,42,0.05)",
            }}
          >
            <Box
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },

                pb: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontSize: 20,

                  fontWeight: 900,

                  color:
                    "#162033",
                }}
              >
                Top performers
              </Typography>

              <Typography
                sx={{
                  color:
                    "#94A3B8",

                  fontSize: 13,

                  mt: 0.4,
                }}
              >
                Real CarbonTrack ranking
                calculated from recorded
                activity data.
              </Typography>
            </Box>

            <Box
              sx={{
                px: {
                  xs: 1.5,
                  sm: 2,
                  md: 3,
                },

                pb: 3,

                display: "grid",

                gridTemplateColumns: {
                  xs:
                    "minmax(0,1fr)",

                  md:
                    "repeat(3,minmax(0,1fr))",
                },

                gap: 2,

                alignItems:
                  "stretch",

                width: "100%",

                boxSizing:
                  "border-box",
              }}
            >
              {topThree.map(
                (user) => (
                  <Box
                    key={
                      user.userId ||
                      `${user.rank}-${user.email}`
                    }
                    sx={{
                      position:
                        "relative",

                      width: "100%",

                      minWidth: 0,

                      boxSizing:
                        "border-box",

                      height: "100%",

                      borderRadius:
                        3.5,

                      p: 2.2,

                      background:
                        getRankBackground(
                          user.rank
                        ),

                      border:
                        "1px solid rgba(148,163,184,0.16)",

                      transition:
                        "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",

                      display: "flex",

                      flexDirection:
                        "column",

                      "&:hover": {
                        transform:
                          "translateY(-6px)",

                        boxShadow:
                          "0 18px 38px rgba(15,23,42,0.10)",

                        borderColor:
                          "rgba(20,150,83,0.25)",
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        width: "100%",
                        minWidth: 0,
                        alignItems:
                          "center",
                      }}
                    >
                      <Avatar
                        src={
                          user.avatar ||
                          undefined
                        }
                        sx={{
                          width: 52,
                          height: 52,

                          flexShrink: 0,

                          border:
                            "3px solid #FFFFFF",

                          boxShadow:
                            "0 6px 16px rgba(0,0,0,0.10)",

                          background:
                            "linear-gradient(135deg,#159653,#08763E)",

                          fontWeight:
                            900,
                        }}
                      >
                        {getInitials(
                          user.name
                        )}
                      </Avatar>

                      <Box
                        sx={{
                          minWidth: 0,

                          flex: 1,

                          overflow:
                            "hidden",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight:
                              900,

                            fontSize:
                              14,

                            color:
                              "#162033",

                            whiteSpace:
                              "nowrap",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {user.name}
                        </Typography>

                        <Typography
                          sx={{
                            color:
                              "#64748B",

                            fontSize:
                              11,

                            mt: 0.2,

                            whiteSpace:
                              "nowrap",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",
                          }}
                        >
                          {
                            user.activityCount
                          }{" "}
                          activities
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: 42,
                          height: 42,

                          flexShrink: 0,

                          borderRadius:
                            "50%",

                          display:
                            "flex",

                          alignItems:
                            "center",

                          justifyContent:
                            "center",

                          background:
                            "#FFFFFF",

                          color:
                            getRankColor(
                              user.rank
                            ),

                          fontWeight:
                            900,

                          fontSize: 13,

                          boxShadow:
                            "0 6px 16px rgba(0,0,0,0.07)",
                        }}
                      >
                        #{user.rank}
                      </Box>
                    </Stack>

                    <Divider
                      sx={{
                        my: 1.8,

                        borderColor:
                          "rgba(148,163,184,0.18)",
                      }}
                    />

                    <Box
                      sx={{
                        mt: "auto",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 10,

                          color:
                            "#64748B",

                          textTransform:
                            "uppercase",

                          fontWeight:
                            800,

                          letterSpacing:
                            "0.6px",
                        }}
                      >
                        Total CO₂
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 26,

                          fontWeight: 900,

                          color:
                            "#162033",

                          mt: 0.2,
                        }}
                      >
                        {user.totalCO2.toFixed(
                          2
                        )}{" "}
                        <Box
                          component="span"
                          sx={{
                            fontSize:
                              12,

                            fontWeight:
                              700,

                            color:
                              "#94A3B8",
                          }}
                        >
                          kg
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                )
              )}
            </Box>
          </Card>
        )}

        {/* GLOBAL RANKING */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,

            border:
              "1px solid #E5EAF0",

            background:
              "#FFFFFF",

            overflow:
              "hidden",

            boxShadow:
              "0 10px 30px rgba(15,23,42,0.05)",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 2,
                md: 3,
              },

              py: 2.3,
            }}
          >
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent:
                  "space-between",

                alignItems:
                  "center",
              }}
            >
              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 20,

                    fontWeight: 900,

                    color:
                      "#162033",
                  }}
                >
                  Global ranking
                </Typography>

                <Typography
                  sx={{
                    color:
                      "#94A3B8",

                    fontSize: 12,

                    mt: 0.35,
                  }}
                >
                  {search
                    ? `Search results for "${search}" • global ranks preserved`
                    : "Live ranking based on real CarbonTrack activity data"}
                </Typography>
              </Box>

              {searching && (
                <CircularProgress
                  size={21}
                  thickness={4}
                  sx={{
                    color:
                      "#149653",

                    flexShrink: 0,
                  }}
                />
              )}
            </Stack>
          </Box>

          <Divider />

          <Box
            sx={{
              display: {
                xs: "none",
                md: "grid",
              },

              gridTemplateColumns:
                "70px minmax(220px,1fr) 130px 150px 180px",

              gap: 2,

              px: 3,

              py: 1.5,

              background:
                "#F8FAFC",
            }}
          >
            {[
              "Rank",
              "Member",
              "Activities",
              "CO₂ footprint",
              "Impact",
            ].map((label) => (
              <Typography
                key={label}
                sx={{
                  fontSize: 10,

                  fontWeight: 900,

                  color:
                    "#94A3B8",

                  textTransform:
                    "uppercase",

                  letterSpacing:
                    "0.7px",
                }}
              >
                {label}
              </Typography>
            ))}
          </Box>

          {leaderboard.length ===
          0 ? (
            <Box
              sx={{
                py: 9,

                px: 3,

                textAlign:
                  "center",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,

                  mx: "auto",

                  mb: 1.5,

                  borderRadius: 3,

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "#F1F5F9",
                }}
              >
                <SearchOutlinedIcon
                  sx={{
                    fontSize: 30,

                    color:
                      "#CBD5E1",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontWeight:
                    900,

                  color:
                    "#334155",
                }}
              >
                {search
                  ? "No users found"
                  : "No leaderboard data"}
              </Typography>

              <Typography
                sx={{
                  color:
                    "#94A3B8",

                  fontSize: 13,

                  mt: 0.5,
                }}
              >
                {search
                  ? "Try searching with another name or email."
                  : "There are no activity records available for the leaderboard yet."}
              </Typography>
            </Box>
          ) : (
            leaderboard.map(
              (user) => {
                const percentage =
                  Math.min(
                    100,

                    Math.max(
                      3,

                      maxCO2 > 0
                        ? (user.totalCO2 /
                            maxCO2) *
                            100
                        : 3
                    )
                  );

                return (
                  <Box
                    key={
                      user.userId ||
                      `${user.rank}-${user.email}`
                    }
                    sx={{
                      display: {
                        xs: "block",
                        md: "grid",
                      },

                      gridTemplateColumns:
                        "70px minmax(220px,1fr) 130px 150px 180px",

                      gap: 2,

                      alignItems:
                        "center",

                      px: {
                        xs: 2,
                        md: 3,
                      },

                      py: 1.9,

                      borderBottom:
                        "1px solid #EEF2F5",

                      background:
                        user.isCurrentUser
                          ? "#F0FAF4"
                          : "#FFFFFF",

                      transition:
                        "all 0.2s ease",

                      position:
                        "relative",

                      "&::before": {
                        content:
                          '""',

                        position:
                          "absolute",

                        left: 0,

                        top: 0,

                        bottom: 0,

                        width:
                          user.isCurrentUser
                            ? 4
                            : 0,

                        background:
                          "#149653",

                        transition:
                          "width 0.2s ease",
                      },

                      "&:hover": {
                        background:
                          user.isCurrentUser
                            ? "#EAF8F0"
                            : "#F8FAFC",

                        transform:
                          "translateX(2px)",
                      },
                    }}
                  >
                    {/* RANK */}

                    <Box
                      sx={{
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap: 0.8,

                        mb: {
                          xs: 1.5,
                          md: 0,
                        },
                      }}
                    >
                      {user.rank <=
                        3 && (
                        <WorkspacePremiumOutlinedIcon
                          sx={{
                            color:
                              getRankColor(
                                user.rank
                              ),

                            fontSize:
                              20,
                          }}
                        />
                      )}

                      <Typography
                        sx={{
                          fontWeight:
                            user.rank <=
                            3
                              ? 900
                              : 800,

                          fontSize:
                            14,

                          color:
                            user.rank <=
                            3
                              ? getRankColor(
                                  user.rank
                                )
                              : "#64748B",
                        }}
                      >
                        #{user.rank}
                      </Typography>
                    </Box>

                    {/* MEMBER */}

                    <Stack
                      direction="row"
                      spacing={1.3}
                      sx={{
                        minWidth: 0,
                        alignItems:
                          "center",
                      }}
                    >
                      <Avatar
                        src={
                          user.avatar ||
                          undefined
                        }
                        sx={{
                          width: 43,
                          height: 43,

                          flexShrink: 0,

                          background:
                            "linear-gradient(135deg,#159653,#08763E)",

                          fontSize: 12,

                          fontWeight: 900,
                        }}
                      >
                        {getInitials(
                          user.name
                        )}
                      </Avatar>

                      <Box
                        sx={{
                          minWidth: 0,

                          flex: 1,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.8}
                          sx={{
                            alignItems:
                              "center",

                            flexWrap:
                              "wrap",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize:
                                13,

                              fontWeight:
                                900,

                              color:
                                "#162033",

                              whiteSpace:
                                "nowrap",

                              overflow:
                                "hidden",

                              textOverflow:
                                "ellipsis",

                              maxWidth: {
                                xs: 190,
                                sm: 260,
                                md: 300,
                              },
                            }}
                          >
                            {user.name}
                          </Typography>

                          {user.isCurrentUser && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{
                                height:
                                  21,

                                fontSize:
                                  10,

                                fontWeight:
                                  900,

                                color:
                                  "#087B41",

                                background:
                                  "#DFF5E7",

                                border:
                                  "1px solid #C5E8D2",
                              }}
                            />
                          )}
                        </Stack>

                        <Typography
                          sx={{
                            fontSize:
                              11,

                            color:
                              "#94A3B8",

                            mt: 0.2,

                            whiteSpace:
                              "nowrap",

                            overflow:
                              "hidden",

                            textOverflow:
                              "ellipsis",

                            maxWidth: {
                              xs: 230,
                              md: 290,
                            },
                          }}
                        >
                          {user.email ||
                            "No email available"}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* ACTIVITIES */}

                    <Box
                      sx={{
                        mt: {
                          xs: 1.5,
                          md: 0,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          display: {
                            xs: "block",
                            md: "none",
                          },

                          fontSize:
                            10,

                          color:
                            "#94A3B8",

                          textTransform:
                            "uppercase",

                          fontWeight:
                            900,

                          mb: 0.3,
                        }}
                      >
                        Activities
                      </Typography>

                      <Typography
                        sx={{
                          fontSize:
                            13,

                          fontWeight:
                            800,

                          color:
                            "#334155",
                        }}
                      >
                        {
                          user.activityCount
                        }
                      </Typography>
                    </Box>

                    {/* CO2 */}

                    <Box
                      sx={{
                        mt: {
                          xs: 1.5,
                          md: 0,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          display: {
                            xs: "block",
                            md: "none",
                          },

                          fontSize:
                            10,

                          color:
                            "#94A3B8",

                          textTransform:
                            "uppercase",

                          fontWeight:
                            900,

                          mb: 0.3,
                        }}
                      >
                        CO₂ footprint
                      </Typography>

                      <Typography
                        sx={{
                          fontSize:
                            14,

                          fontWeight:
                            900,

                          color:
                            "#162033",
                        }}
                      >
                        {user.totalCO2.toFixed(
                          2
                        )}{" "}
                        <Box
                          component="span"
                          sx={{
                            fontSize:
                              11,

                            color:
                              "#94A3B8",

                            fontWeight:
                              700,
                          }}
                        >
                          kg
                        </Box>
                      </Typography>
                    </Box>

                    {/* IMPACT */}

                    <Box
                      sx={{
                        mt: {
                          xs: 1.5,
                          md: 0,
                        },
                      }}
                    >
                      <Stack
                        direction="row"
                        sx={{
                          justifyContent:
                            "space-between",

                          alignItems:
                            "center",

                          mb: 0.6,
                        }}
                      >
                        <Typography
                          sx={{
                            display: {
                              xs: "block",
                              md: "none",
                            },

                            fontSize:
                              10,

                            color:
                              "#94A3B8",

                            textTransform:
                              "uppercase",

                            fontWeight:
                              900,
                          }}
                        >
                          Impact
                        </Typography>

                        <Typography
                          sx={{
                            fontSize:
                              10,

                            fontWeight:
                              800,

                            color:
                              "#64748B",

                            ml: {
                              xs: "auto",
                              md: 0,
                            },
                          }}
                        >
                          {
                            user.sustainabilityScore
                          }{" "}
                          score
                        </Typography>
                      </Stack>

                      <LinearProgress
                        variant="determinate"
                        value={
                          percentage
                        }
                        sx={{
                          height: 7,

                          borderRadius:
                            10,

                          background:
                            "#EAF0EC",

                          overflow:
                            "hidden",

                          "& .MuiLinearProgress-bar":
                            {
                              borderRadius:
                                10,

                              background:
                                user.rank <=
                                3
                                  ? "#149653"
                                  : "#7BAE91",
                            },
                        }}
                      />
                    </Box>
                  </Box>
                );
              }
            )
          )}
        </Card>

        {/* FOOTNOTE */}

        <Typography
          sx={{
            textAlign:
              "center",

            color:
              "#94A3B8",

            fontSize:
              11,

            mt: 2.5,

            lineHeight:
              1.7,

            px: 2,
          }}
        >
          Rankings are calculated from
          real CarbonTrack activity records.
          Lower total recorded CO₂ receives a
          higher position. Search filters the
          results without changing global ranks.
        </Typography>
      </Box>
    </Box>
  );
};

export default Leaderboard;
