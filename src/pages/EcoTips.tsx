import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import RecyclingOutlinedIcon from "@mui/icons-material/RecyclingOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

import api from "../services/api";

type Category =
  | "All"
  | "Transport"
  | "Energy"
  | "Food"
  | "Waste"
  | "Water"
  | "Lifestyle";

type EcoCategory = Exclude<Category, "All">;

interface EcoTip {
  id: string;
  title: string;
  description: string;
  category: EcoCategory;
  difficulty: "Easy" | "Medium" | "Advanced";
  estimatedCO2Saving: number;
  actionLabel: string;
  icon: string;
  completed: boolean;
  completedAt?: string | null;
}

interface EcoTipStats {
  completedCount: number;
  totalSavedCO2: number;
  streak: number;
  focusCategory: string;
}

interface EcoTipsResponse {
  tips: EcoTip[];
  dailyTip: EcoTip | null;
  personalizedTips: EcoTip[];
  stats: EcoTipStats;
  categories: Category[];
}

const categoryIcons: Record<
  EcoCategory,
  typeof SpaOutlinedIcon
> = {
  Transport: DirectionsCarOutlinedIcon,
  Energy: BoltOutlinedIcon,
  Food: RestaurantOutlinedIcon,
  Waste: RecyclingOutlinedIcon,
  Water: WaterDropOutlinedIcon,
  Lifestyle: ParkOutlinedIcon,
};

const categoryColors: Record<
  EcoCategory,
  {
    color: string;
    background: string;
    softBackground: string;
    border: string;
  }
> = {
  Transport: {
    color: "#2563EB",
    background: "#EFF6FF",
    softBackground: "#F8FBFF",
    border: "#DBEAFE",
  },
  Energy: {
    color: "#D97706",
    background: "#FFF7E8",
    softBackground: "#FFFCF5",
    border: "#FDE7B2",
  },
  Food: {
    color: "#16A34A",
    background: "#EFFBF3",
    softBackground: "#F8FFF9",
    border: "#D5F0DC",
  },
  Waste: {
    color: "#7C3AED",
    background: "#F5F0FF",
    softBackground: "#FCFAFF",
    border: "#E9DFFF",
  },
  Water: {
    color: "#0284C7",
    background: "#EFFAFF",
    softBackground: "#F8FDFF",
    border: "#D6F1FC",
  },
  Lifestyle: {
    color: "#149653",
    background: "#EAF8F0",
    softBackground: "#F7FCF9",
    border: "#CDE8D7",
  },
};

const getCategoryIcon = (category: EcoCategory) =>
  categoryIcons[category] || SpaOutlinedIcon;

const getDifficultyStyle = (
  difficulty: EcoTip["difficulty"]
) => {
  if (difficulty === "Easy") {
    return {
      color: "#15803D",
      background: "#F0FDF4",
      border: "#BBF7D0",
    };
  }

  if (difficulty === "Medium") {
    return {
      color: "#B45309",
      background: "#FFFBEB",
      border: "#FDE68A",
    };
  }

  return {
    color: "#7C3AED",
    background: "#FAF5FF",
    border: "#E9D5FF",
  };
};

const EcoTips = () => {
  const [data, setData] =
    useState<EcoTipsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("All");
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const fetchEcoTips = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await api.get("/eco-tips", {
          params: {
            category: selectedCategory,
            search: search.trim(),
          },
        });

        if (response.data?.success) {
          setData(response.data.data);
        } else {
          setError("Unable to load eco tips.");
        }
      } catch (err) {
        console.error("Eco tips fetch error:", err);
        setError(
          "Unable to load eco tips. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedCategory, search]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchEcoTips();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchEcoTips]);

  const handleToggle = async (tipId: string) => {
    try {
      setActionLoading(tipId);

      await api.post(`/eco-tips/${tipId}/toggle`);

      await fetchEcoTips();
    } catch (err) {
      console.error("Eco tip update error:", err);
      setError("Unable to update this tip.");
    } finally {
      setActionLoading(null);
    }
  };

  const tips = data?.tips || [];
  const stats = data?.stats;

  const categories: Category[] =
    data?.categories || [
      "All",
      "Transport",
      "Energy",
      "Food",
      "Waste",
      "Water",
      "Lifestyle",
    ];

  const completionProgress = useMemo(() => {
    if (!tips.length) return 0;

    return Math.min(
      100,
      (tips.filter((tip) => tip.completed).length /
        tips.length) *
        100
    );
  }, [tips]);

  const renderTipIcon = (
    tip: EcoTip,
    large = false
  ) => {
    const Icon = getCategoryIcon(tip.category);
    const colors = categoryColors[tip.category];

    return (
      <Box
        sx={{
          width: {
            xs: large ? 60 : 50,
            sm: large ? 68 : 54,
          },
          height: {
            xs: large ? 60 : 50,
            sm: large ? 68 : 54,
          },
          flexShrink: 0,
          borderRadius: large ? 3.5 : 2.8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${colors.background}, ${colors.softBackground})`,
          color: colors.color,
          border: `1px solid ${colors.border}`,
          boxShadow:
            "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
        <Icon
          sx={{
            fontSize: large ? 32 : 24,
          }}
        />
      </Box>
    );
  };

  const renderTipCard = (tip: EcoTip) => {
    const colors = categoryColors[tip.category];
    const difficulty = getDifficultyStyle(
      tip.difficulty
    );

    const isLoading = actionLoading === tip.id;

    return (
      <Card
        key={tip.id}
        elevation={0}
        sx={{
          height: "100%",
          minHeight: {
            xs: 350,
            sm: 330,
          },
          borderRadius: 4,
          border: tip.completed
            ? "1px solid #BFE2CC"
            : "1px solid #E6EBE8",
          background: tip.completed
            ? "linear-gradient(145deg,#FFFFFF 0%,#F4FBF6 100%)"
            : "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition:
            "transform .28s ease, box-shadow .28s ease, border-color .28s ease",
          boxShadow:
            "0 8px 28px rgba(15,23,42,0.045)",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${colors.color}, ${colors.color}40)`,
          },

          "&:hover": {
            transform: "translateY(-7px)",
            borderColor: tip.completed
              ? "#A8D8B9"
              : "#CDE3D5",
            boxShadow:
              "0 24px 55px rgba(15,23,42,0.11)",
          },
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2.2,
              sm: 2.7,
            },
            display: "flex",
            flexDirection: "column",
            flex: 1,
            "&:last-child": {
              pb: {
                xs: 2.2,
                sm: 2.7,
              },
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="flex-start"
          >
            {renderTipIcon(tip)}

            <Box
              sx={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <Stack
                direction="row"
                spacing={0.7}
                flexWrap="wrap"
                useFlexGap
                sx={{ mb: 1 }}
              >
                <Chip
                  label={tip.category}
                  size="small"
                  sx={{
                    height: 24,
                    borderRadius: 1.7,
                    fontSize: 10,
                    fontWeight: 850,
                    color: colors.color,
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                  }}
                />

                <Chip
                  label={tip.difficulty}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 24,
                    borderRadius: 1.7,
                    fontSize: 10,
                    fontWeight: 800,
                    color: difficulty.color,
                    background:
                      difficulty.background,
                    borderColor: difficulty.border,
                  }}
                />
              </Stack>

              <Typography
                sx={{
                  fontSize: {
                    xs: 15,
                    sm: 16,
                  },
                  fontWeight: 850,
                  color: "#172033",
                  lineHeight: 1.4,
                  letterSpacing: "-0.2px",
                }}
              >
                {tip.title}
              </Typography>
            </Box>

            {tip.completed && (
              <Tooltip title="Completed">
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#EAF8F0",
                    color: "#149653",
                    border: "1px solid #CDE8D7",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircleOutlinedIcon
                    sx={{ fontSize: 19 }}
                  />
                </Box>
              </Tooltip>
            )}
          </Stack>

          <Typography
            sx={{
              color: "#64748B",
              fontSize: 13,
              lineHeight: 1.75,
              mt: 2.2,
              minHeight: {
                xs: "auto",
                md: 68,
              },
            }}
          >
            {tip.description}
          </Typography>

          <Box
            sx={{
              mt: "auto",
              pt: 2.2,
            }}
          >
            <Divider
              sx={{
                mb: 2,
                borderColor: "#EEF2F5",
              }}
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              justifyContent="space-between"
              alignItems={{
                xs: "stretch",
                sm: "flex-end",
              }}
              spacing={1.5}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={0.7}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <TrendingDownOutlinedIcon
                    sx={{
                      fontSize: 16,
                      color: "#149653",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 10,
                      color: "#94A3B8",
                      textTransform: "uppercase",
                      fontWeight: 850,
                      letterSpacing: ".55px",
                    }}
                  >
                    Potential impact
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 18,
                    fontWeight: 900,
                    color: "#149653",
                    mt: 0.35,
                  }}
                >
                  ~
                  {tip.estimatedCO2Saving.toFixed(
                    2
                  )}{" "}
                  <Box
                    component="span"
                    sx={{
                      fontSize: 11,
                      color: "#64748B",
                      fontWeight: 650,
                    }}
                  >
                    kg CO₂
                  </Box>
                </Typography>
              </Box>

              <Button
                onClick={() =>
                  handleToggle(tip.id)
                }
                disabled={isLoading}
                variant={
                  tip.completed
                    ? "outlined"
                    : "contained"
                }
                endIcon={
                  !isLoading && !tip.completed ? (
                    <ArrowForwardRoundedIcon
                      sx={{ fontSize: 17 }}
                    />
                  ) : undefined
                }
                startIcon={
                  isLoading ? (
                    <CircularProgress
                      size={15}
                      sx={{
                        color: tip.completed
                          ? "#149653"
                          : "#FFFFFF",
                      }}
                    />
                  ) : tip.completed ? (
                    <CheckCircleOutlinedIcon
                      sx={{ fontSize: 17 }}
                    />
                  ) : undefined
                }
                sx={{
                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                  minWidth: {
                    xs: "100%",
                    sm: 120,
                  },
                  borderRadius: 2.2,
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: 11.5,
                  px: 1.7,
                  py: 1.05,
                  whiteSpace: "nowrap",

                  ...(tip.completed
                    ? {
                        color: "#149653",
                        borderColor: "#B9DEC8",
                        background: "#F5FCF7",
                        "&:hover": {
                          borderColor: "#149653",
                          background: "#EAF8F0",
                        },
                      }
                    : {
                        color: "#FFFFFF",
                        background:
                          "linear-gradient(135deg,#149653 0%,#087B41 100%)",
                        boxShadow:
                          "0 8px 20px rgba(20,150,83,.20)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg,#11864A 0%,#076D39 100%)",
                          boxShadow:
                            "0 13px 28px rgba(20,150,83,.26)",
                          transform:
                            "translateY(-1px)",
                        },
                      }),
                }}
              >
                {tip.completed
                  ? "Completed"
                  : tip.actionLabel}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading && !data) {
    return (
      <Box
        sx={{
          minHeight:
            "calc(100vh - 70px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg,#F6FAF7,#F1F7F3)",
          px: 2,
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#149653,#087B41)",
              boxShadow:
                "0 18px 40px rgba(20,150,83,.22)",
            }}
          >
            <CircularProgress
              size={30}
              thickness={4}
              sx={{ color: "#FFFFFF" }}
            />
          </Box>

          <Box sx={{ textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: 15,
                color: "#334155",
                fontWeight: 800,
              }}
            >
              Preparing your eco tips
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: "#94A3B8",
                mt: 0.4,
              }}
            >
              Finding personalized ways to reduce
              your impact...
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight:
          "calc(100vh - 70px)",
        background:
          "radial-gradient(circle at 8% 0%, rgba(20,150,83,.08), transparent 28%), linear-gradient(180deg,#F7FAF8 0%,#F3F7F5 100%)",
        px: {
          xs: 1.3,
          sm: 2.2,
          md: 3,
          lg: 4,
        },
        py: {
          xs: 1.8,
          sm: 2.5,
          md: 3.5,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1440,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            mb: 3,
            position: "relative",
            overflow: "hidden",
            borderRadius: {
              xs: 3.5,
              md: 4.5,
            },
            border:
              "1px solid rgba(205,232,215,.95)",
            background:
              "linear-gradient(135deg,#FFFFFF 0%,#F2FBF5 55%,#EAF8F0 100%)",
            boxShadow:
              "0 14px 45px rgba(15,23,42,.055)",

            "&::before": {
              content: '""',
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              right: -120,
              top: -160,
              background:
                "rgba(20,150,83,.08)",
            },

            "&::after": {
              content: '""',
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: "50%",
              right: 90,
              bottom: -150,
              border:
                "1px solid rgba(20,150,83,.08)",
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              p: {
                xs: 2.2,
                sm: 3,
                md: 3.6,
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                lg: "row",
              }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{
                xs: "stretch",
                lg: "center",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction="row"
                  spacing={1.4}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: {
                        xs: 48,
                        sm: 56,
                      },
                      height: {
                        xs: 48,
                        sm: 56,
                      },
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background:
                        "linear-gradient(135deg,#168A52,#08763E)",
                      boxShadow:
                        "0 12px 28px rgba(20,150,83,.22)",
                    }}
                  >
                    <SpaOutlinedIcon
                      sx={{
                        color: "#FFFFFF",
                        fontSize: {
                          xs: 26,
                          sm: 30,
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: {
                          xs: 25,
                          sm: 30,
                          md: 34,
                        },
                        fontWeight: 950,
                        color: "#101827",
                        letterSpacing: "-1.2px",
                        lineHeight: 1.05,
                      }}
                    >
                      Eco Tips
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.45,
                        fontSize: {
                          xs: 9.5,
                          sm: 10.5,
                        },
                        fontWeight: 900,
                        color: "#149653",
                        textTransform: "uppercase",
                        letterSpacing: "1.15px",
                      }}
                    >
                      Smarter choices • Lower impact
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  sx={{
                    mt: 1.8,
                    fontSize: {
                      xs: 12.5,
                      sm: 13.5,
                    },
                    color: "#64748B",
                    lineHeight: 1.8,
                    maxWidth: 720,
                  }}
                >
                  Discover practical ways to reduce
                  your environmental impact. Your
                  recommendations are based on your
                  CarbonTrack activity data.
                </Typography>
              </Box>

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{
                  width: {
                    xs: "100%",
                    lg: "auto",
                  },
                  minWidth: {
                    lg: 350,
                  },
                }}
              >
                <TextField
                  size="small"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search eco tips..."
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      minHeight: 46,
                      borderRadius: 2.7,
                      background: "#FFFFFF",
                      boxShadow:
                        "0 6px 18px rgba(15,23,42,.04)",

                      "& fieldset": {
                        borderColor: "#DCE6E0",
                      },

                      "&:hover fieldset": {
                        borderColor: "#B7CDBE",
                      },

                      "&.Mui-focused fieldset": {
                        borderColor: "#149653",
                        borderWidth: 1.5,
                      },
                    },

                    "& .MuiInputBase-input": {
                      fontSize: 13,
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon
                            sx={{
                              color: "#94A3B8",
                              fontSize: 20,
                            }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Tooltip title="Refresh tips">
                  <IconButton
                    onClick={() =>
                      fetchEcoTips(true)
                    }
                    disabled={refreshing}
                    sx={{
                      width: 46,
                      height: 46,
                      border:
                        "1px solid #DCE6E0",
                      background: "#FFFFFF",
                      borderRadius: 2.7,
                      color: "#64748B",
                      alignSelf: {
                        xs: "flex-end",
                        sm: "center",
                      },
                      boxShadow:
                        "0 6px 18px rgba(15,23,42,.04)",

                      "&:hover": {
                        color: "#149653",
                        background: "#F0FAF4",
                        borderColor: "#CDE8D7",
                        transform:
                          "rotate(8deg)",
                      },
                    }}
                  >
                    {refreshing ? (
                      <CircularProgress
                        size={18}
                        sx={{
                          color: "#149653",
                        }}
                      />
                    ) : (
                      <AutorenewOutlinedIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 2.7,
              border: "1px solid #FECACA",
              boxShadow:
                "0 7px 22px rgba(127,29,29,.05)",
            }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2,1fr)",
              lg: "repeat(4,1fr)",
            },
            gap: {
              xs: 1.4,
              sm: 1.7,
              md: 2,
            },
            mb: 3,
          }}
        >
          {[
            {
              title: "Tips Completed",
              value:
                stats?.completedCount || 0,
              helper: "Actions completed",
              icon: CheckCircleOutlinedIcon,
              color: "#149653",
              bg: "#EAF8F0",
              border: "#CDE8D7",
            },
            {
              title: "CO₂ Saved",
              value: `${(
                stats?.totalSavedCO2 || 0
              ).toFixed(2)} kg`,
              helper: "Estimated savings",
              icon: TrendingDownOutlinedIcon,
              color: "#087B41",
              bg: "#EAF8F0",
              border: "#CDE8D7",
            },
            {
              title: "Current Streak",
              value: `${stats?.streak || 0} days`,
              helper: "Keep the momentum",
              icon: LocalFireDepartmentOutlinedIcon,
              color: "#EA580C",
              bg: "#FFF1EA",
              border: "#FED7AA",
            },
            {
              title: "Focus Area",
              value:
                stats?.focusCategory ||
                "Lifestyle",
              helper: "Personalized category",
              icon: SpaOutlinedIcon,
              color: "#6D28D9",
              bg: "#F3EEFF",
              border: "#E9D5FF",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <Card
                key={stat.title}
                elevation={0}
                sx={{
                  minHeight: {
                    xs: 112,
                    sm: 125,
                  },
                  border:
                    "1px solid #E2E9E4",
                  borderRadius: 3.5,
                  background: "#FFFFFF",
                  position: "relative",
                  overflow: "hidden",
                  transition:
                    "transform .25s ease, box-shadow .25s ease",
                  boxShadow:
                    "0 8px 26px rgba(15,23,42,.04)",

                  "&::after": {
                    content: '""',
                    position: "absolute",
                    right: -35,
                    top: -40,
                    width: 110,
                    height: 110,
                    borderRadius: "50%",
                    background: stat.bg,
                    opacity: 0.7,
                  },

                  "&:hover": {
                    transform:
                      "translateY(-5px)",
                    boxShadow:
                      "0 20px 40px rgba(15,23,42,.09)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 1.8,
                      sm: 2.3,
                    },
                    position: "relative",
                    zIndex: 1,
                    "&:last-child": {
                      pb: {
                        xs: 1.8,
                        sm: 2.3,
                      },
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.4}
                    alignItems="center"
                  >
                    <Box
                      sx={{
                        width: {
                          xs: 44,
                          sm: 48,
                        },
                        height: {
                          xs: 44,
                          sm: 48,
                        },
                        borderRadius: 2.6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: stat.bg,
                        border: `1px solid ${stat.border}`,
                      }}
                    >
                      <Icon
                        sx={{
                          color: stat.color,
                          fontSize: 23,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 9.5,
                          color: "#94A3B8",
                          fontWeight: 900,
                          textTransform:
                            "uppercase",
                          letterSpacing: ".65px",
                        }}
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: {
                            xs: 17,
                            sm: 20,
                          },
                          fontWeight: 950,
                          color: "#162033",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow:
                            "ellipsis",
                        }}
                      >
                        {stat.value}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.35,
                          fontSize: 10.5,
                          color: "#94A3B8",
                        }}
                      >
                        {stat.helper}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {data?.dailyTip && (
          <Card
            elevation={0}
            sx={{
              mb: 3.5,
              borderRadius: 4.5,
              overflow: "hidden",
              border:
                "1px solid #CDE8D7",
              background:
                "linear-gradient(135deg,#FFFFFF 0%,#F0FBF4 60%,#E8F8EE 100%)",
              boxShadow:
                "0 16px 42px rgba(15,23,42,.065)",
              position: "relative",

              "&::before": {
                content: '""',
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                right: -120,
                top: -140,
                background:
                  "rgba(20,150,83,.07)",
              },
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2.2,
                  sm: 2.8,
                  md: 3.4,
                },
                position: "relative",
                zIndex: 1,
                "&:last-child": {
                  pb: {
                    xs: 2.2,
                    sm: 2.8,
                    md: 3.4,
                  },
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  md: "row",
                }}
                spacing={2.3}
                alignItems={{
                  xs: "stretch",
                  md: "center",
                }}
              >
                <Box>
                  {renderTipIcon(
                    data.dailyTip,
                    true
                  )}
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.8}
                    alignItems="center"
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Chip
                      icon={
                        <AutoAwesomeOutlinedIcon
                          sx={{
                            fontSize:
                              "15px !important",
                          }}
                        />
                      }
                      label="TIP OF THE DAY"
                      size="small"
                      sx={{
                        height: 26,
                        fontSize: 9.5,
                        fontWeight: 900,
                        color: "#087B41",
                        background: "#DFF5E7",
                        border:
                          "1px solid #C8E9D4",
                      }}
                    />

                    <Chip
                      label={
                        data.dailyTip.category
                      }
                      size="small"
                      sx={{
                        height: 26,
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: "#64748B",
                        background: "#FFFFFF",
                        border:
                          "1px solid #E2E8F0",
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: 19,
                        sm: 22,
                        md: 24,
                      },
                      fontWeight: 950,
                      color: "#162033",
                      mt: 1.1,
                      letterSpacing: "-.45px",
                    }}
                  >
                    {data.dailyTip.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#64748B",
                      fontSize: 13,
                      lineHeight: 1.75,
                      mt: 0.65,
                      maxWidth: 760,
                    }}
                  >
                    {data.dailyTip.description}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    width: {
                      xs: "100%",
                      md: 180,
                    },
                    p: 1.8,
                    borderRadius: 3,
                    background:
                      "rgba(255,255,255,.82)",
                    border:
                      "1px solid rgba(205,232,215,.95)",
                    boxShadow:
                      "0 8px 24px rgba(15,23,42,.04)",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 9.5,
                      color: "#94A3B8",
                      textTransform:
                        "uppercase",
                      fontWeight: 900,
                      letterSpacing: ".65px",
                    }}
                  >
                    Potential saving
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 22,
                      fontWeight: 950,
                      color: "#149653",
                      mt: 0.2,
                    }}
                  >
                    ~
                    {data.dailyTip.estimatedCO2Saving.toFixed(
                      2
                    )}{" "}
                    <Box
                      component="span"
                      sx={{
                        fontSize: 11,
                        color: "#64748B",
                        fontWeight: 650,
                      }}
                    >
                      kg CO₂
                    </Box>
                  </Typography>

                  <Button
                    fullWidth
                    onClick={() =>
                      handleToggle(
                        data.dailyTip!.id
                      )
                    }
                    disabled={
                      actionLoading ===
                      data.dailyTip.id
                    }
                    variant={
                      data.dailyTip.completed
                        ? "outlined"
                        : "contained"
                    }
                    startIcon={
                      actionLoading ===
                      data.dailyTip.id ? (
                        <CircularProgress
                          size={15}
                          sx={{
                            color:
                              data.dailyTip
                                .completed
                                ? "#149653"
                                : "#FFFFFF",
                          }}
                        />
                      ) : data.dailyTip
                          .completed ? (
                        <CheckCircleOutlinedIcon
                          sx={{ fontSize: 17 }}
                        />
                      ) : undefined
                    }
                    endIcon={
                      actionLoading !==
                        data.dailyTip.id &&
                      !data.dailyTip.completed ? (
                        <ArrowForwardRoundedIcon
                          sx={{ fontSize: 17 }}
                        />
                      ) : undefined
                    }
                    sx={{
                      mt: 1.3,
                      minHeight: 40,
                      borderRadius: 2.2,
                      textTransform: "none",
                      fontWeight: 850,
                      fontSize: 11.5,

                      ...(data.dailyTip.completed
                        ? {
                            color: "#149653",
                            borderColor:
                              "#B9DEC8",
                            background:
                              "#F5FCF7",
                            "&:hover": {
                              background:
                                "#EAF8F0",
                            },
                          }
                        : {
                            color: "#FFFFFF",
                            background:
                              "linear-gradient(135deg,#149653,#087B41)",
                            boxShadow:
                              "0 8px 20px rgba(20,150,83,.18)",
                            "&:hover": {
                              background:
                                "linear-gradient(135deg,#11864A,#076D39)",
                            },
                          }),
                    }}
                  >
                    {data.dailyTip.completed
                      ? "Completed"
                      : "Take action"}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {data?.personalizedTips?.length ? (
          <Box sx={{ mb: 3.8 }}>
            <Box sx={{ mb: 1.8 }}>
              <Stack
                direction="row"
                spacing={0.9}
                alignItems="center"
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#EAF8F0",
                    border:
                      "1px solid #CDE8D7",
                  }}
                >
                  <AutoAwesomeOutlinedIcon
                    sx={{
                      color: "#149653",
                      fontSize: 18,
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: {
                        xs: 19,
                        sm: 21,
                      },
                      fontWeight: 950,
                      color: "#162033",
                      letterSpacing: "-.35px",
                    }}
                  >
                    Recommended for you
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize: 12.5,
                      color: "#94A3B8",
                    }}
                  >
                    Personalized suggestions based
                    on your highest-impact activity
                    category:{" "}
                    <Box
                      component="span"
                      sx={{
                        color: "#149653",
                        fontWeight: 850,
                      }}
                    >
                      {stats?.focusCategory ||
                        "Lifestyle"}
                    </Box>
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2,1fr)",
                  xl: "repeat(3,1fr)",
                },
                gap: 2.2,
              }}
            >
              {data.personalizedTips.map(
                renderTipCard
              )}
            </Box>
          </Box>
        ) : null}

        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 3.5,
            border:
              "1px solid #E1E8E3",
            background:
              "rgba(255,255,255,.92)",
            boxShadow:
              "0 8px 25px rgba(15,23,42,.035)",
          }}
        >
          <Box
            sx={{
              p: {
                xs: 1,
                sm: 1.3,
              },
              display: "flex",
              gap: 0.8,
              overflowX: "auto",
              scrollbarWidth: "thin",

              "&::-webkit-scrollbar": {
                height: 4,
              },

              "&::-webkit-scrollbar-thumb": {
                background: "#CBD5E1",
                borderRadius: 10,
              },
            }}
          >
            {categories.map((category) => {
              const active =
                selectedCategory === category;

              const categoryStyle =
                category !== "All"
                  ? categoryColors[
                      category
                    ]
                  : null;

              return (
                <Button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(
                      category
                    )
                  }
                  startIcon={
                    category !== "All" &&
                    categoryStyle
                      ? (() => {
                          const Icon =
                            getCategoryIcon(
                              category as EcoCategory
                            );

                          return (
                            <Icon
                              sx={{
                                fontSize:
                                  "16px !important",
                                color: active
                                  ? "#FFFFFF"
                                  : categoryStyle.color,
                              }}
                            />
                          );
                        })()
                      : undefined
                  }
                  sx={{
                    flexShrink: 0,
                    minHeight: 39,
                    borderRadius: 2.2,
                    textTransform: "none",
                    fontSize: 11.5,
                    fontWeight: 850,
                    px: 1.6,
                    color: active
                      ? "#FFFFFF"
                      : "#64748B",
                    background: active
                      ? "linear-gradient(135deg,#149653,#087B41)"
                      : "#F7FAF8",
                    border: active
                      ? "1px solid #149653"
                      : "1px solid #E6ECE8",
                    boxShadow: active
                      ? "0 7px 16px rgba(20,150,83,.17)"
                      : "none",
                    whiteSpace: "nowrap",

                    "&:hover": {
                      color: active
                        ? "#FFFFFF"
                        : "#149653",
                      background: active
                        ? "#087B41"
                        : "#EFF8F2",
                      borderColor: active
                        ? "#087B41"
                        : "#CDE8D7",
                    },
                  }}
                >
                  {category}
                </Button>
              );
            })}
          </Box>
        </Card>

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "flex-end",
          }}
          spacing={1.2}
          mb={2}
        >
          <Box>
            <Typography
              sx={{
                fontSize: {
                  xs: 20,
                  sm: 22,
                },
                fontWeight: 950,
                color: "#162033",
                letterSpacing: "-.4px",
              }}
            >
              Explore eco tips
            </Typography>

            <Typography
              sx={{
                fontSize: 12.5,
                color: "#94A3B8",
                mt: 0.4,
              }}
            >
              Small actions can create meaningful
              long-term impact.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.7,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              background: "#EAF8F0",
              border:
                "1px solid #CDE8D7",
            }}
          >
            <SpaOutlinedIcon
              sx={{
                fontSize: 15,
                color: "#149653",
              }}
            />

            <Typography
              sx={{
                fontSize: 10.5,
                fontWeight: 900,
                color: "#149653",
              }}
            >
              {tips.length} tips
            </Typography>
          </Box>
        </Stack>

        {tips.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border:
                "1px solid #E1E8E3",
              background: "#FFFFFF",
              textAlign: "center",
              py: 9,
              px: 2,
              boxShadow:
                "0 10px 30px rgba(15,23,42,.035)",
            }}
          >
            <Box
              sx={{
                width: 76,
                height: 76,
                mx: "auto",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#F1F5F3",
                border:
                  "1px solid #E2EAE5",
              }}
            >
              <SpaOutlinedIcon
                sx={{
                  fontSize: 38,
                  color: "#B8C5BE",
                }}
              />
            </Box>

            <Typography
              sx={{
                mt: 2,
                fontSize: 18,
                fontWeight: 900,
                color: "#334155",
              }}
            >
              No eco tips found
            </Typography>

            <Typography
              sx={{
                mt: 0.6,
                color: "#94A3B8",
                fontSize: 13,
              }}
            >
              Try another category or search term.
            </Typography>
          </Card>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2,1fr)",
                xl: "repeat(3,1fr)",
              },
              gap: {
                xs: 1.7,
                sm: 2,
                md: 2.2,
              },
            }}
          >
            {tips.map(renderTipCard)}
          </Box>
        )}

        <Card
          elevation={0}
          sx={{
            mt: 3.5,
            borderRadius: 4,
            border:
              "1px solid #DCE8E0",
            background:
              "linear-gradient(135deg,#FFFFFF,#F4FBF7)",
            boxShadow:
              "0 10px 30px rgba(15,23,42,.04)",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
                md: 2.8,
              },
              "&:last-child": {
                pb: {
                  xs: 2,
                  sm: 2.5,
                  md: 2.8,
                },
              },
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
            >
              <Avatar
                sx={{
                  width: 50,
                  height: 50,
                  background: "#EAF8F0",
                  color: "#149653",
                  border:
                    "1px solid #CDE8D7",
                }}
              >
                <TrendingDownOutlinedIcon />
              </Avatar>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#162033",
                      }}
                    >
                      Your eco action progress
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#94A3B8",
                        mt: 0.3,
                      }}
                    >
                      Keep completing practical
                      actions to build your
                      sustainability habit.
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      display: {
                        xs: "none",
                        sm: "block",
                      },
                      fontSize: 19,
                      fontWeight: 950,
                      color: "#149653",
                    }}
                  >
                    {Math.round(
                      completionProgress
                    )}
                    %
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={completionProgress}
                  sx={{
                    mt: 1.6,
                    height: 9,
                    borderRadius: 10,
                    background: "#E6EEE9",

                    "& .MuiLinearProgress-bar":
                      {
                        borderRadius: 10,
                        background:
                          "linear-gradient(90deg,#149653,#54B77C)",
                      },
                  }}
                />

                <Typography
                  sx={{
                    display: {
                      xs: "block",
                      sm: "none",
                    },
                    mt: 0.8,
                    fontSize: 12,
                    fontWeight: 850,
                    color: "#149653",
                    textAlign: "right",
                  }}
                >
                  {Math.round(
                    completionProgress
                  )}
                  % complete
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Stack
          direction="row"
          spacing={0.8}
          justifyContent="center"
          alignItems="center"
          sx={{
            mt: 2.5,
            mb: 1,
            px: 1,
          }}
        >
          <EmojiEventsOutlinedIcon
            sx={{
              fontSize: 15,
              color: "#A0ADA5",
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              textAlign: "center",
              color: "#94A3B8",
              fontSize: 11,
              lineHeight: 1.7,
            }}
          >
            CO₂ savings shown for eco tips are
            estimated potential savings. Your
            CarbonTrack activity emissions remain
            based on your recorded activities.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default EcoTips;