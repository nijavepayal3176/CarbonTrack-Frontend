import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Co2OutlinedIcon from "@mui/icons-material/Co2Outlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

import api from "../services/api";

interface Activity {
  _id: string;
  category: string;
  activityType: string;
  quantity: number;
  unit: string;
  emissionFactor: number;
  co2Emission: number;
  date: string;
}

interface ApiResponse {
  data?: {
    activities?: Activity[];
  };
}

const categories = [
  "ALL",
  "TRANSPORT",
  "ENERGY",
  "ELECTRICITY",
  "FOOD",
  "SHOPPING",
  "WASTE",
  "OTHER",
];

const Reports = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* =========================================================
     LOAD ACTIVITIES
  ========================================================= */

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get<ApiResponse>("/activities");

      const fetchedActivities =
        response.data?.data?.activities || [];

      setActivities(
        Array.isArray(fetchedActivities)
          ? fetchedActivities
          : []
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  /* =========================================================
     FILTERED ACTIVITIES
  ========================================================= */

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.date);

      if (Number.isNaN(activityDate.getTime())) {
        return false;
      }

      const normalizedDate =
        activityDate.toISOString().split("T")[0];

      const matchesCategory =
        categoryFilter === "ALL" ||
        activity.category === categoryFilter;

      const matchesFrom =
        !fromDate || normalizedDate >= fromDate;

      const matchesTo =
        !toDate || normalizedDate <= toDate;

      return (
        matchesCategory &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    activities,
    categoryFilter,
    fromDate,
    toDate,
  ]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalCO2 = useMemo(() => {
    return filteredActivities.reduce(
      (sum, activity) =>
        sum + Number(activity.co2Emission || 0),
      0
    );
  }, [filteredActivities]);

  const averageCO2 = useMemo(() => {
    if (!filteredActivities.length) {
      return 0;
    }

    return (
      totalCO2 / filteredActivities.length
    );
  }, [filteredActivities.length, totalCO2]);

  const highestImpactActivity = useMemo(() => {
    if (!filteredActivities.length) {
      return null;
    }

    return filteredActivities.reduce(
      (highest, current) =>
        Number(current.co2Emission || 0) >
        Number(highest.co2Emission || 0)
          ? current
          : highest
    );
  }, [filteredActivities]);

  /* =========================================================
     CATEGORY DATA
  ========================================================= */

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    filteredActivities.forEach((activity) => {
      const category =
        activity.category || "OTHER";

      totals[category] =
        (totals[category] || 0) +
        Number(activity.co2Emission || 0);
    });

    return Object.entries(totals)
      .map(([category, emissions]) => ({
        category,
        emissions: Number(
          emissions.toFixed(2)
        ),
      }))
      .sort(
        (a, b) =>
          b.emissions - a.emissions
      );
  }, [filteredActivities]);

  /* =========================================================
     MONTHLY DATA
  ========================================================= */

  const monthlyData = useMemo(() => {
    const totals: Record<string, number> = {};

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      totals[key] =
        (totals[key] || 0) +
        Number(activity.co2Emission || 0);
    });

    return Object.entries(totals)
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(([month, emissions]) => {
        const [year, monthNumber] =
          month.split("-");

        const label = new Date(
          Number(year),
          Number(monthNumber) - 1,
          1
        ).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        });

        return {
          month: label,
          emissions: Number(
            emissions.toFixed(2)
          ),
        };
      });
  }, [filteredActivities]);

  /* =========================================================
     CATEGORY HELPERS
  ========================================================= */

  const getCategoryColor = (
    category: string
  ) => {
    switch (category) {
      case "TRANSPORT":
        return "#16804F";

      case "ENERGY":
        return "#D9822B";

      case "ELECTRICITY":
        return "#6B5CC5";

      case "FOOD":
        return "#C65D45";

      case "SHOPPING":
        return "#337AB7";

      case "WASTE":
        return "#718078";

      default:
        return "#16804F";
    }
  };

  const getCategoryIcon = (
    category: string
  ) => {
    switch (category) {
      case "TRANSPORT":
        return (
          <DirectionsCarOutlinedIcon />
        );

      case "ENERGY":
      case "ELECTRICITY":
        return <BoltOutlinedIcon />;

      case "FOOD":
        return (
          <RestaurantOutlinedIcon />
        );

      case "SHOPPING":
        return (
          <ShoppingBagOutlinedIcon />
        );

      case "WASTE":
        return (
          <DeleteOutlineOutlinedIcon />
        );

      default:
        return (
          <CategoryOutlinedIcon />
        );
    }
  };

  /* =========================================================
     CSV EXPORT
  ========================================================= */

  const exportCSV = () => {
    if (!filteredActivities.length) {
      return;
    }

    const headers = [
      "Activity",
      "Category",
      "Quantity",
      "Unit",
      "Emission Factor",
      "CO2 Emission (kg)",
      "Date",
    ];

    const rows = filteredActivities.map(
      (activity) => [
        activity.activityType,
        activity.category,
        activity.quantity,
        activity.unit,
        activity.emissionFactor,
        Number(
          activity.co2Emission || 0
        ).toFixed(3),
        new Date(
          activity.date
        ).toLocaleDateString(),
      ]
    );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(value ?? "");

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `carbon-report-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  const resetFilters = () => {
    setCategoryFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 20% 0%, rgba(22,128,79,.07), transparent 30%), linear-gradient(180deg,#F8FBF9 0%,#F2F7F4 100%)",
        }}
      >
        <Stack
          spacing={2}
          sx={{ alignItems: "center" }}
        >
          <Box
            sx={{
              width: 62,
              height: 62,
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#16804F,#0F6B40)",
              color: "#FFFFFF",
              boxShadow:
                "0 16px 36px rgba(22,128,79,.22)",
            }}
          >
            <Co2OutlinedIcon
              sx={{ fontSize: 31 }}
            />
          </Box>

          <CircularProgress
            size={28}
            thickness={4}
            sx={{
              color: "#16804F",
            }}
          />

          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "#718078",
            }}
          >
            Preparing your real carbon report...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at 10% 0%, rgba(22,128,79,.055), transparent 28%), linear-gradient(180deg,#F8FBF9 0%,#F2F7F4 100%)",
        px: {
          xs: 1.5,
          sm: 2.5,
          md: 4,
        },
        py: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          maxWidth: 1240,
          mx: "auto",
        }}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

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
            justifyContent:
              "space-between",
            mb: {
              xs: 2.5,
              md: 3.5,
            },
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                mb: 0.8,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    "#16804F",
                  boxShadow:
                    "0 0 0 5px rgba(22,128,79,.10)",
                }}
              />

              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 900,
                  color: "#16804F",
                  letterSpacing: 1.2,
                  textTransform:
                    "uppercase",
                }}
              >
                Carbon analytics
              </Typography>
            </Stack>

            <Typography
              sx={{
                fontSize: {
                  xs: 30,
                  sm: 36,
                  md: 42,
                },
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: "-1.8px",
                color: "#17221C",
                background:
                  "linear-gradient(135deg,#17221C 20%,#16804F 100%)",
                WebkitBackgroundClip:
                  "text",
                WebkitTextFillColor:
                  "transparent",
              }}
            >
              Reports
            </Typography>

            <Typography
              sx={{
                mt: 0.9,
                maxWidth: 620,
                fontSize: {
                  xs: 13,
                  sm: 14,
                },
                lineHeight: 1.65,
                color: "#718078",
                fontWeight: 500,
              }}
            >
              Understand your real carbon
              footprint through activity trends,
              category insights, and emission
              performance.
            </Typography>
          </Box>

          {/* PREMIUM EXPORT BUTTON */}

<Button
  variant="contained"
  onClick={exportCSV}
  disabled={filteredActivities.length === 0}
  startIcon={
    <DownloadOutlinedIcon
      sx={{
        fontSize: "20px !important",
      }}
    />
  }
  sx={{
    height: 46,
    minWidth: 142,
    px: 2.4,
    borderRadius: "13px",

    textTransform: "none",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.1,

    color: "#FFFFFF",

    background:
      "linear-gradient(135deg, #16804F 0%, #0F6B40 100%)",

    border: "1px solid rgba(255,255,255,.12)",

    boxShadow:
      "0 8px 20px rgba(22,128,79,.18), inset 0 1px 0 rgba(255,255,255,.16)",

    transition:
      "all .22s cubic-bezier(.4,0,.2,1)",

    "&:hover": {
      background:
        "linear-gradient(135deg, #18945B 0%, #0D7045 100%)",

      transform: "translateY(-2px)",

      boxShadow:
        "0 12px 26px rgba(22,128,79,.25), inset 0 1px 0 rgba(255,255,255,.18)",
    },

    "&:active": {
      transform: "translateY(0)",
      boxShadow:
        "0 6px 14px rgba(22,128,79,.18)",
    },

    "&.Mui-disabled": {
      color: "#A7B3AC",
      background:
        "linear-gradient(135deg,#E9EFEB,#E3EAE6)",
      borderColor: "#E0E7E2",
      boxShadow: "none",
      cursor: "not-allowed",
    },

    "& .MuiButton-startIcon": {
      marginRight: 0.8,
    },
  }}
>
  Export CSV
</Button>
          
        </Stack>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: "14px",
              border: "1px solid #F2D2CC",
            }}
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: {
              xs: "20px",
              md: "22px",
            },
            border:
              "1px solid #E1EAE5",
            backgroundColor:
              "#FFFFFF",
            boxShadow:
              "0 12px 34px rgba(20,80,50,.06)",
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
              spacing={1.5}
              sx={{
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
                mb: 2,
              }}
            >
              <Box>
                <Stack
                  direction="row"
                  spacing={0.8}
                  sx={{ mb: 0.5, alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius:
                        "50%",
                      backgroundColor:
                        "#16804F",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: "#16804F",
                      letterSpacing:
                        0.7,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Customize view
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 900,
                    color: "#17221C",
                  }}
                >
                  Report filters
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 12,
                    color: "#819088",
                  }}
                >
                  Filter the report using your
                  actual logged activities.
                </Typography>
              </Box>

              {(categoryFilter !==
                "ALL" ||
                fromDate ||
                toDate) && (
                <Button
                  onClick={resetFilters}
                  size="small"
                  sx={{
                    alignSelf: {
                      xs: "flex-start",
                      sm: "center",
                    },
                    textTransform:
                      "none",
                    fontWeight: 800,
                    color: "#16804F",
                    borderRadius:
                      "9px",
                    "&:hover": {
                      backgroundColor:
                        "#EAF7F0",
                    },
                  }}
                >
                  Clear filters
                </Button>
              )}
            </Stack>

            <Grid
              container
              spacing={1.5}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={
                    categoryFilter
                  }
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "12px",
                        backgroundColor:
                          "#FBFDFC",
                        "& fieldset": {
                          borderColor:
                            "#DFE9E3",
                        },
                        "&:hover fieldset":
                          {
                            borderColor:
                              "#B8D5C3",
                          },
                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                            borderWidth:
                              "1.5px",
                          },
                      },
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#7B8982",
                        fontWeight:
                          600,
                      },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                >
                  {categories.map(
                    (category) => (
                      <MenuItem
                        key={category}
                        value={category}
                      >
                        {category ===
                        "ALL"
                          ? "All categories"
                          : category}
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="From date"
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(
                      event.target.value
                    )
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "12px",
                        backgroundColor:
                          "#FBFDFC",
                        "& fieldset": {
                          borderColor:
                            "#DFE9E3",
                        },
                        "&:hover fieldset":
                          {
                            borderColor:
                              "#B8D5C3",
                          },
                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                            borderWidth:
                              "1.5px",
                          },
                      },
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#7B8982",
                        fontWeight:
                          600,
                      },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 4,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="To date"
                  value={toDate}
                  onChange={(event) =>
                    setToDate(
                      event.target.value
                    )
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "12px",
                        backgroundColor:
                          "#FBFDFC",
                        "& fieldset": {
                          borderColor:
                            "#DFE9E3",
                        },
                        "&:hover fieldset":
                          {
                            borderColor:
                              "#B8D5C3",
                          },
                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                            borderWidth:
                              "1.5px",
                          },
                      },
                    "& .MuiInputLabel-root":
                      {
                        color:
                          "#7B8982",
                        fontWeight:
                          600,
                      },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <Grid
          container
          spacing={{
            xs: 1.5,
            sm: 2,
          }}
          sx={{
            mb: 3,
          }}
        >
          {/* TOTAL CO2 */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "20px",
                border:
                  "1px solid #E2EAE5",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 9px 30px rgba(20,80,50,.055)",
                transition:
                  "all .22s ease",
                "&:hover": {
                  transform:
                    "translateY(-3px)",
                  borderColor:
                    "#CFE1D6",
                  boxShadow:
                    "0 16px 38px rgba(20,80,50,.10)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.3,
                  "&:last-child": {
                    pb: 2.3,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#C65D45",
                      background:
                        "linear-gradient(135deg,#FFF4F0,#FBEDE9)",
                      border:
                        "1px solid #F5DED7",
                    }}
                  >
                    <Co2OutlinedIcon
                      sx={{
                        fontSize: 23,
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Total emissions
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 23,
                        fontWeight: 900,
                        color: "#17221C",
                        lineHeight: 1.15,
                      }}
                    >
                      {totalCO2.toFixed(2)}

                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          fontSize: 11,
                          color: "#819088",
                        }}
                      >
                        kg CO₂
                      </Box>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ACTIVITIES */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "20px",
                border:
                  "1px solid #E2EAE5",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 9px 30px rgba(20,80,50,.055)",
                transition:
                  "all .22s ease",
                "&:hover": {
                  transform:
                    "translateY(-3px)",
                  borderColor:
                    "#CFE1D6",
                  boxShadow:
                    "0 16px 38px rgba(20,80,50,.10)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.3,
                  "&:last-child": {
                    pb: 2.3,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#16804F",
                      background:
                        "linear-gradient(135deg,#EFFAF3,#E8F5EE)",
                      border:
                        "1px solid #D7EBDD",
                    }}
                  >
                    <TrackChangesOutlinedIcon
                      sx={{
                        fontSize: 22,
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Activities
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 23,
                        fontWeight: 900,
                        color: "#17221C",
                        lineHeight: 1.15,
                      }}
                    >
                      {
                        filteredActivities.length
                      }
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* AVERAGE */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "20px",
                border:
                  "1px solid #E2EAE5",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 9px 30px rgba(20,80,50,.055)",
                transition:
                  "all .22s ease",
                "&:hover": {
                  transform:
                    "translateY(-3px)",
                  borderColor:
                    "#CFE1D6",
                  boxShadow:
                    "0 16px 38px rgba(20,80,50,.10)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.3,
                  "&:last-child": {
                    pb: 2.3,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#6B5CC5",
                      background:
                        "linear-gradient(135deg,#F5F3FC,#F0EEFA)",
                      border:
                        "1px solid #E3DFF5",
                    }}
                  >
                    <TrendingDownOutlinedIcon
                      sx={{
                        fontSize: 22,
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Average impact
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 23,
                        fontWeight: 900,
                        color: "#17221C",
                        lineHeight: 1.15,
                      }}
                    >
                      {averageCO2.toFixed(2)}

                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          fontSize: 11,
                          color: "#819088",
                        }}
                      >
                        kg
                      </Box>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* HIGHEST IMPACT */}

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                height: "100%",
                borderRadius: "20px",
                border:
                  "1px solid #E2EAE5",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 9px 30px rgba(20,80,50,.055)",
                transition:
                  "all .22s ease",
                "&:hover": {
                  transform:
                    "translateY(-3px)",
                  borderColor:
                    "#CFE1D6",
                  boxShadow:
                    "0 16px 38px rgba(20,80,50,.10)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 2.3,
                  "&:last-child": {
                    pb: 2.3,
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center" }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#D9822B",
                      background:
                        "linear-gradient(135deg,#FFF7ED,#FFF3E6)",
                      border:
                        "1px solid #F4E2CC",
                    }}
                  >
                    <EmojiEventsOutlinedIcon
                      sx={{
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
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Highest impact
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#17221C",
                        overflow:
                          "hidden",
                        textOverflow:
                          "ellipsis",
                        whiteSpace:
                          "nowrap",
                      }}
                    >
                      {highestImpactActivity
                        ? highestImpactActivity.activityType
                        : "No data"}
                    </Typography>

                    {highestImpactActivity && (
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "#819088",
                          fontWeight: 700,
                        }}
                      >
                        {Number(
                          highestImpactActivity.co2Emission ||
                            0
                        ).toFixed(2)}{" "}
                        kg CO₂
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* =====================================================
            CHARTS
        ===================================================== */}

        {filteredActivities.length > 0 ? (
          <Grid
            container
            spacing={2.5}
            sx={{
              mb: 3,
            }}
          >
            {/* =================================================
                IMPROVED EMISSION TREND
            ================================================= */}

            <Grid
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  minHeight: 410,
                  borderRadius: "24px",
                  border:
                    "1px solid #E1EAE5",
                  background:
                    "linear-gradient(180deg,#FFFFFF 0%,#FCFEFD 100%)",
                  boxShadow:
                    "0 14px 42px rgba(20,80,50,.065)",
                  overflow: "hidden",
                  position: "relative",
                  transition:
                    "all .22s ease",
                  "&:hover": {
                    borderColor:
                      "#CFE1D7",
                    boxShadow:
                      "0 20px 50px rgba(20,80,50,.10)",
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                      "linear-gradient(90deg,#16804F,#55B77F,#16804F)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2,
                      sm: 2.8,
                      md: 3,
                    },
                    "&:last-child": {
                      pb: {
                        xs: 2,
                        sm: 2.8,
                        md: 3,
                      },
                    },
                  }}
                >
                  {/* CHART HEADER */}

                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      mb: 2.5,
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Stack
                        direction="row"
                        spacing={0.8}
                        sx={{
                          mb: 0.8,
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius:
                              "50%",
                            backgroundColor:
                              "#16804F",
                            boxShadow:
                              "0 0 0 5px rgba(22,128,79,.09)",
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 900,
                            color:
                              "#16804F",
                            letterSpacing:
                              0.9,
                            textTransform:
                              "uppercase",
                          }}
                        >
                          Analytics
                        </Typography>
                      </Stack>

                      <Typography
                        sx={{
                          fontSize: {
                            xs: 19,
                            sm: 21,
                          },
                          fontWeight: 900,
                          color:
                            "#17221C",
                          letterSpacing:
                            "-0.3px",
                        }}
                      >
                        Emission trend
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.45,
                          fontSize: 12,
                          color:
                            "#819088",
                          lineHeight: 1.55,
                        }}
                      >
                        Monthly CO₂ footprint
                        from your logged
                        activities.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        flexShrink: 0,
                        px: 1.2,
                        py: 0.8,
                        borderRadius: "11px",
                        background:
                          "linear-gradient(135deg,#EFFAF3,#E7F5EC)",
                        border:
                          "1px solid #D6EBDD",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 9,
                          fontWeight: 800,
                          color:
                            "#819088",
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            0.5,
                        }}
                      >
                        Total
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.1,
                          fontSize: 13,
                          fontWeight: 900,
                          color:
                            "#16804F",
                        }}
                      >
                        {totalCO2.toFixed(
                          1
                        )}{" "}
                        kg
                      </Typography>
                    </Box>
                  </Stack>

                  {/* CHART */}

                  {monthlyData.length > 0 ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: {
                          xs: 260,
                          sm: 290,
                          md: 305,
                        },
                      }}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <AreaChart
                          data={
                            monthlyData
                          }
                          margin={{
                            top: 12,
                            right: 12,
                            left: 0,
                            bottom: 4,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="premiumEmissionGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#16804F"
                                stopOpacity={
                                  0.34
                                }
                              />

                              <stop
                                offset="45%"
                                stopColor="#16804F"
                                stopOpacity={
                                  0.13
                                }
                              />

                              <stop
                                offset="100%"
                                stopColor="#16804F"
                                stopOpacity={
                                  0.015
                                }
                              />
                            </linearGradient>

                            <filter
                              id="emissionShadow"
                              x="-20%"
                              y="-20%"
                              width="140%"
                              height="160%"
                            >
                              <feDropShadow
                                dx="0"
                                dy="5"
                                stdDeviation="5"
                                floodColor="#16804F"
                                floodOpacity="0.16"
                              />
                            </filter>
                          </defs>

                          <CartesianGrid
                            strokeDasharray="4 6"
                            stroke="#EAF0EC"
                            vertical={false}
                          />

                          <XAxis
                            dataKey="month"
                            tick={{
                              fontSize: 10,
                              fill: "#819088",
                              fontWeight: 600,
                            }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={10}
                          />

                          <YAxis
                            tick={{
                              fontSize: 10,
                              fill: "#819088",
                              fontWeight: 600,
                            }}
                            axisLine={false}
                            tickLine={false}
                            width={46}
                            tickFormatter={(
                              value
                            ) =>
                              `${value}`
                            }
                            domain={[
                              0,
                              "auto",
                            ]}
                          />

                          <Tooltip
                            cursor={{
                              stroke:
                                "#B8D8C4",
                              strokeWidth: 1,
                              strokeDasharray:
                                "4 4",
                            }}
                            formatter={(
                              value
                            ) => [
                              `${Number(
                                value ?? 0
                              ).toFixed(
                                2
                              )} kg CO₂`,
                              "Emissions",
                            ]}
                            labelFormatter={(
                              label
                            ) =>
                              `Month: ${label}`
                            }
                            contentStyle={{
                              borderRadius:
                                14,
                              border:
                                "1px solid #DDE9E2",
                              background:
                                "rgba(255,255,255,.97)",
                              boxShadow:
                                "0 14px 34px rgba(20,80,50,.14)",
                              padding:
                                "11px 14px",
                              fontSize: 12,
                            }}
                            labelStyle={{
                              color:
                                "#17221C",
                              fontWeight: 900,
                              marginBottom: 5,
                            }}
                            itemStyle={{
                              color:
                                "#16804F",
                              fontWeight: 800,
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="emissions"
                            stroke="#16804F"
                            strokeWidth={3.2}
                            fill="url(#premiumEmissionGradient)"
                            filter="url(#emissionShadow)"
                            activeDot={{
                              r: 7,
                              fill: "#16804F",
                              stroke:
                                "#FFFFFF",
                              strokeWidth: 3,
                            }}
                            dot={{
                              r: 4.5,
                              fill: "#16804F",
                              stroke:
                                "#FFFFFF",
                              strokeWidth: 2.5,
                            }}
                            isAnimationActive={
                              true
                            }
                            animationDuration={
                              900
                            }
                            animationEasing="ease-out"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        py: 8,
                        textAlign:
                          "center",
                        color:
                          "#819088",
                      }}
                    >
                      No trend data available.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* =================================================
                CATEGORY CHART
            ================================================= */}

            <Grid
              size={{
                xs: 12,
                md: 5,
              }}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  minHeight: 410,
                  borderRadius: "24px",
                  border:
                    "1px solid #E1EAE5",
                  backgroundColor:
                    "#FFFFFF",
                  boxShadow:
                    "0 14px 42px rgba(20,80,50,.06)",
                  overflow: "hidden",
                  transition:
                    "all .22s ease",
                  "&:hover": {
                    borderColor:
                      "#D1E2D8",
                    boxShadow:
                      "0 20px 48px rgba(20,80,50,.09)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: {
                      xs: 2,
                      sm: 2.8,
                    },
                    "&:last-child": {
                      pb: {
                        xs: 2,
                        sm: 2.8,
                      },
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.7}
                    sx={{
                      mb: 0.7,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius:
                          "50%",
                        backgroundColor:
                          "#16804F",
                        boxShadow:
                          "0 0 0 4px rgba(22,128,79,.09)",
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: "#16804F",
                        letterSpacing:
                          0.8,
                        textTransform:
                          "uppercase",
                      }}
                    >
                      Distribution
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: 19,
                      fontWeight: 900,
                      color: "#17221C",
                    }}
                  >
                    Category impact
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      mb: 2.5,
                      fontSize: 12,
                      color: "#819088",
                    }}
                  >
                    Which categories contribute
                    most to your footprint.
                  </Typography>

                  <Box
                    sx={{
                      width: "100%",
                      height: 285,
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={
                          categoryData
                        }
                        layout="vertical"
                        margin={{
                          left: 5,
                          right: 10,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#EDF2EE"
                          horizontal={false}
                        />

                        <XAxis
                          type="number"
                          tick={{
                            fontSize: 10,
                            fill: "#819088",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />

                        <YAxis
                          type="category"
                          dataKey="category"
                          tick={{
                            fontSize: 9.5,
                            fill: "#718078",
                            fontWeight: 700,
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={92}
                        />

                        <Tooltip
                          formatter={(
                            value
                          ) => [
                            `${Number(
                              value ?? 0
                            ).toFixed(
                              2
                            )} kg CO₂`,
                            "Emissions",
                          ]}
                          contentStyle={{
                            borderRadius: 12,
                            border:
                              "1px solid #E1EAE4",
                            boxShadow:
                              "0 10px 25px rgba(20,80,50,.10)",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        />

                        <Bar
                          dataKey="emissions"
                          fill="#16804F"
                          radius={[
                            0, 7, 7, 0,
                          ]}
                          barSize={20}
                          animationDuration={
                            700
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: "22px",
              border:
                "1px solid #E2EAE5",
              backgroundColor:
                "#FFFFFF",
              boxShadow:
                "0 12px 38px rgba(20,80,50,.055)",
            }}
          >
            <CardContent
              sx={{
                py: 8,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  mx: "auto",
                  borderRadius: "22px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "linear-gradient(135deg,#EFFAF3,#E8F5EE)",
                  color: "#16804F",
                  border:
                    "1px solid #D7EBDD",
                }}
              >
                <Co2OutlinedIcon
                  sx={{
                    fontSize: 34,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  mt: 2,
                  fontSize: 18,
                  fontWeight: 900,
                  color: "#17221C",
                }}
              >
                No report data available
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  maxWidth: 440,
                  mx: "auto",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#819088",
                }}
              >
                There are no activities matching
                the selected filters. Try clearing
                the filters or log a new activity.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* =====================================================
            CATEGORY INSIGHTS
        ===================================================== */}

        {categoryData.length > 0 && (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: "22px",
              border:
                "1px solid #E2EAE5",
              backgroundColor:
                "#FFFFFF",
              boxShadow:
                "0 14px 40px rgba(20,80,50,.065)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: {
                  xs: 2,
                  sm: 3,
                },
                py: 2.5,
                background:
                  "linear-gradient(135deg,#F8FCF9,#EFF8F2)",
                borderBottom:
                  "1px solid #E8F0EB",
              }}
            >
              <Stack
                direction="row"
                spacing={0.8}
                sx={{ mb: 0.6, alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius:
                      "50%",
                    backgroundColor:
                      "#16804F",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#16804F",
                    letterSpacing:
                      0.8,
                    textTransform:
                      "uppercase",
                  }}
                >
                  Insights
                </Typography>
              </Stack>

              <Typography
                sx={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: "#17221C",
                }}
              >
                Category breakdown
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: 12,
                  color: "#819088",
                }}
              >
                Detailed emissions calculated from
                your actual activities.
              </Typography>
            </Box>

            <Stack>
              {categoryData.map(
                (item, index) => {
                  const color =
                    getCategoryColor(
                      item.category
                    );

                  const percentage =
                    totalCO2 > 0
                      ? (item.emissions /
                          totalCO2) *
                        100
                      : 0;

                  return (
                    <Box
                      key={
                        item.category
                      }
                      sx={{
                        px: {
                          xs: 1.8,
                          sm: 3,
                        },
                        py: 2,
                        transition:
                          "background-color .2s ease",
                        "&:hover": {
                          backgroundColor:
                            "#FBFDFB",
                        },
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={1.5}
                        sx={{
                          alignItems: {
                            xs: "stretch",
                            sm: "center",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.3}
                          sx={{
                            alignItems:
                              "center",
                            minWidth: {
                              sm: 190,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              flexShrink: 0,
                              borderRadius:
                                "13px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color,
                              backgroundColor:
                                `${color}10`,
                              border: `1px solid ${color}18`,
                            }}
                          >
                            {getCategoryIcon(
                              item.category
                            )}
                          </Box>

                          <Box>
                            <Typography
                              sx={{
                                fontSize:
                                  13,
                                fontWeight:
                                  900,
                                color:
                                  "#17221C",
                              }}
                            >
                              {
                                item.category
                              }
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.15,
                                fontSize:
                                  10.5,
                                color:
                                  "#819088",
                              }}
                            >
                              {percentage.toFixed(
                                1
                              )}
                              % of total
                            </Typography>
                          </Box>
                        </Stack>

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Box
                            sx={{
                              height: 8,
                              borderRadius:
                                999,
                              backgroundColor:
                                "#EDF3EF",
                              overflow:
                                "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.min(
                                  percentage,
                                  100
                                )}%`,
                                height:
                                  "100%",
                                borderRadius:
                                  999,
                                backgroundColor:
                                  color,
                                transition:
                                  "width .4s ease",
                              }}
                            />
                          </Box>
                        </Box>

                        <Typography
                          sx={{
                            minWidth: {
                              sm: 100,
                            },
                            textAlign: {
                              xs: "left",
                              sm: "right",
                            },
                            fontSize:
                              15,
                            fontWeight:
                              900,
                            color,
                          }}
                        >
                          {item.emissions.toFixed(
                            2
                          )}{" "}
                          kg
                        </Typography>
                      </Stack>

                      {index <
                        categoryData.length -
                          1 && (
                        <Divider
                          sx={{
                            mt: 2,
                            borderColor:
                              "#EEF2EF",
                          }}
                        />
                      )}
                    </Box>
                  );
                }
              )}
            </Stack>
          </Card>
        )}

        {/* =====================================================
            ACTIVITY REPORT
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            borderRadius: "22px",
            border:
              "1px solid #E2EAE5",
            backgroundColor:
              "#FFFFFF",
            boxShadow:
              "0 14px 40px rgba(20,80,50,.06)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: {
                xs: 2,
                sm: 3,
              },
              py: 2.5,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              sx={{
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                justifyContent:
                  "space-between",
              }}
            >
              <Box>

<Stack
  direction="row"
  spacing={0.8}
  sx={{
    mb: 0.6,
    alignItems: "center",
  }}
>

                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius:
                        "50%",
                      backgroundColor:
                        "#16804F",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 900,
                      color: "#16804F",
                      letterSpacing:
                        0.8,
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Activity history
                  </Typography>
                </Stack>

                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#17221C",
                  }}
                >
                  Activity report
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: 12,
                    color: "#819088",
                  }}
                >
                  Every row below comes directly
                  from your saved activities.
                </Typography>
              </Box>

              <Chip
                label={`${filteredActivities.length} ${
                  filteredActivities.length ===
                  1
                    ? "record"
                    : "records"
                }`}
                size="small"
                sx={{
                  borderRadius: "9px",
                  background:
                    "linear-gradient(135deg,#EFFAF3,#E8F5EE)",
                  color: "#16804F",
                  fontWeight: 900,
                  border:
                    "1px solid #D5EBDD",
                }}
              />
            </Stack>
          </Box>

          <Divider
            sx={{
              borderColor: "#EDF2EE",
            }}
          />

          {filteredActivities.length ===
          0 ? (
            <Box
              sx={{
                py: 7,
                px: 2,
                textAlign: "center",
              }}
            >
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#17221C",
                }}
              >
                No activities found
              </Typography>

              <Typography
                sx={{
                  mt: 0.6,
                  fontSize: 12,
                  color: "#819088",
                }}
              >
                Adjust your filters or add an
                activity from the Activities page.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
              }}
            >
              <Box
                sx={{
                  minWidth: 760,
                }}
              >
                {/* TABLE HEADER */}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.6fr 1fr 1fr 1fr 1.2fr",
                    px: {
                      xs: 2,
                      sm: 3,
                    },
                    py: 1.5,
                    background:
                      "linear-gradient(180deg,#F8FBF9,#F4F8F5)",
                    borderTop:
                      "1px solid #EDF2EE",
                    borderBottom:
                      "1px solid #E8EFEB",
                  }}
                >
                  {[
                    "Activity",
                    "Category",
                    "Quantity",
                    "Date",
                    "CO₂ impact",
                  ].map(
                    (heading, index) => (
                      <Typography
                        key={heading}
                        sx={{
                          fontSize: 10,
                          fontWeight: 900,
                          color:
                            "#819088",
                          textTransform:
                            "uppercase",
                          textAlign:
                            index === 4
                              ? "right"
                              : "left",
                        }}
                      >
                        {heading}
                      </Typography>
                    )
                  )}
                </Box>

                {filteredActivities.map(
                  (activity, index) => {
                    const color =
                      getCategoryColor(
                        activity.category
                      );

                    return (
                      <Box
                        key={
                          activity._id
                        }
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "1.6fr 1fr 1fr 1fr 1.2fr",
                          alignItems:
                            "center",
                          px: {
                            xs: 2,
                            sm: 3,
                          },
                          py: 1.8,
                          borderTop:
                            index === 0
                              ? "none"
                              : "1px solid #EEF2EF",
                          transition:
                            "all .18s ease",
                          "&:hover": {
                            backgroundColor:
                              "#F9FCFA",
                            boxShadow:
                              "inset 3px 0 0 #16804F",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.2}
                          sx={{ alignItems: "center" }}
                        >
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              flexShrink: 0,
                              borderRadius:
                                "12px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color,
                              backgroundColor:
                                `${color}12`,
                              border: `1px solid ${color}18`,
                            }}
                          >
                            {getCategoryIcon(
                              activity.category
                            )}
                          </Box>

                          <Box
                            sx={{
                              minWidth: 0,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  13,
                                fontWeight:
                                  900,
                                color:
                                  "#17221C",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {
                                activity.activityType
                              }
                            </Typography>

                            <Typography
                              sx={{
                                fontSize:
                                  10,
                                color:
                                  "#819088",
                              }}
                            >
                              Factor:{" "}
                              {
                                activity.emissionFactor
                              }
                            </Typography>
                          </Box>
                        </Stack>

                        <Chip
                          label={
                            activity.category
                          }
                          size="small"
                          sx={{
                            justifySelf:
                              "start",
                            height: 24,
                            borderRadius:
                              "8px",
                            fontSize:
                              9,
                            fontWeight:
                              900,
                            color,
                            backgroundColor:
                              `${color}12`,
                            border: `1px solid ${color}18`,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 700,
                            color:
                              "#53645B",
                          }}
                        >
                          {
                            activity.quantity
                          }{" "}
                          {
                            activity.unit
                          }
                        </Typography>

                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: "center" }}
                        >
                          <CalendarTodayOutlinedIcon
                            sx={{
                              fontSize: 13,
                              color:
                                "#9AA69F",
                            }}
                          />

                          <Typography
                            sx={{
                              fontSize:
                                11.5,
                              color:
                                "#718078",
                              fontWeight:
                                600,
                            }}
                          >
                            {new Date(
                              activity.date
                            ).toLocaleDateString()}
                          </Typography>
                        </Stack>

                        <Box
                          sx={{
                            justifySelf:
                              "end",
                            minWidth: 92,
                            px: 1.2,
                            py: 0.75,
                            borderRadius:
                              "10px",
                            background:
                              "linear-gradient(135deg,#F0FAF4,#E8F5EE)",
                            border:
                              "1px solid #D5EBDD",
                            textAlign:
                              "center",
                            boxShadow:
                              "0 4px 12px rgba(22,128,79,.06)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize:
                                13,
                              fontWeight:
                                900,
                              color:
                                "#16804F",
                            }}
                          >
                            {Number(
                              activity.co2Emission ||
                                0
                            ).toFixed(
                              2
                            )}{" "}
                            kg
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }
                )}
              </Box>
            </Box>
          )}
        </Card>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <Stack
          direction="row"
          spacing={0.8}
          sx={{
            mt: 2.5,
            px: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Co2OutlinedIcon
            sx={{
              fontSize: 14,
              color: "#A0ABA4",
            }}
          />

          <Typography
            sx={{
              fontSize: 10.5,
              color: "#A0ABA4",
              textAlign: "center",
            }}
          >
            Report values are generated from
            activities saved in your CarbonTrack
            account. No dummy report data is used.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

export default Reports;