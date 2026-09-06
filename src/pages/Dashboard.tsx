
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useNavigate } from "react-router-dom";

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

const categoryColors: Record<string, string> = {
  TRANSPORT: "#EF2D2D",
  FOOD: "#FF7100",
  ENERGY: "#FFAA00",
  ELECTRICITY: "#F5C400",
  SHOPPING: "#7437E8",
  WASTE: "#1479E8",
  OTHER: "#9299A8",
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =====================================================
   * LOAD ACTIVITIES
   * =====================================================
   *
   * Backend/API logic remains unchanged.
   */
  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/activities");

      const data = response.data?.data?.activities;

      const fetchedActivities: Activity[] =
        Array.isArray(data) ? data : [];

      setActivities(fetchedActivities);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  /*
   * =====================================================
   * REAL TOTAL CO2
   * =====================================================
   */
  const totalCO2 = useMemo(() => {
    return activities.reduce(
      (total, activity) =>
        total + Number(activity.co2Emission || 0),
      0
    );
  }, [activities]);

  /*
   * =====================================================
   * CURRENT MONTH ACTIVITIES
   * =====================================================
   */
  const monthlyActivities = useMemo(() => {
    const now = new Date();

    return activities.filter((activity) => {
      const date = new Date(activity.date);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  }, [activities]);

  /*
   * =====================================================
   * CURRENT MONTH CO2
   * =====================================================
   */
  const monthlyCO2 = useMemo(() => {
    return monthlyActivities.reduce(
      (total, activity) =>
        total + Number(activity.co2Emission || 0),
      0
    );
  }, [monthlyActivities]);

  /*
   * =====================================================
   * DAILY AVERAGE
   * =====================================================
   */
  const averageDailyCO2 = useMemo(() => {
    if (monthlyActivities.length === 0) {
      return "0.0";
    }

    const now = new Date();

    const daysPassed = Math.max(
      now.getDate(),
      1
    );

    return (
      monthlyCO2 / daysPassed
    ).toFixed(1);
  }, [monthlyCO2, monthlyActivities]);

  /*
   * =====================================================
   * CATEGORY TOTALS
   * =====================================================
   */
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};

    activities.forEach((activity) => {
      const category = activity.category;

      totals[category] =
        (totals[category] || 0) +
        Number(activity.co2Emission || 0);
    });

    return Object.entries(totals)
      .map(([category, value]) => ({
        category,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [activities]);

  /*
   * =====================================================
   * CHART DATA
   * =====================================================
   */
  const chartData = useMemo(() => {
    const fallbackCategories = [
      "TRANSPORT",
      "FOOD",
      "ENERGY",
      "SHOPPING",
      "WASTE",
      "OTHER",
    ];

    const source =
      categoryData.length > 0
        ? categoryData
        : fallbackCategories.map(
            (category) => ({
              category,
              value: 0,
            })
          );

    return source.slice(0, 6);
  }, [categoryData]);

  /*
   * =====================================================
   * MAX CHART VALUE
   * =====================================================
   */
  const maxChartValue = useMemo(() => {
    return Math.max(
      ...chartData.map(
        (item) => item.value
      ),
      1
    );
  }, [chartData]);

  /*
   * =====================================================
   * REAL CATEGORY COUNT
   * =====================================================
   */
  const categoriesUsed = useMemo(() => {
    return new Set(
      activities.map(
        (activity) => activity.category
      )
    ).size;
  }, [activities]);

  /*
   * =====================================================
   * MONTH LABEL
   * =====================================================
   */
  const monthLabel = new Intl.DateTimeFormat(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  ).format(new Date());

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */


  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    ).format(parsedDate);
  };

  const formatActivityName = (
    activity: Activity
  ) => {
    const names: Record<
      string,
      string
    > = {
      Car: "Private Vehicle",
      Bus: "Bus",
      Train: "Train",
      Bike: "Bike",
      Walking: "Walking",
      LPG: "LPG Usage",
      NaturalGas: "Natural Gas",
      Electricity:
        "Electricity Usage",
      VegetarianMeal:
        "Vegetarian Meal",
      VeganMeal: "Vegan Meal",
      MeatMeal: "Meat Meal",
      Clothing:
        "Clothing Purchase",
      Electronics:
        "Electronics Purchase",
      GeneralWaste:
        "General Waste",
      RecycledWaste:
        "Recycled Waste",
      Other: "Other Activity",
    };

    return (
      names[
        activity.activityType
      ] ||
      activity.activityType
    );
  };

  const getCategoryIcon = (
    category: string
  ) => {
    switch (category) {
      case "TRANSPORT":
        return (
          <DirectionsCarOutlinedIcon fontSize="small" />
        );

      case "FOOD":
        return (
          <RestaurantOutlinedIcon fontSize="small" />
        );

      case "ENERGY":
      case "ELECTRICITY":
        return (
          <BoltOutlinedIcon fontSize="small" />
        );

      case "SHOPPING":
        return (
          <ShoppingBagOutlinedIcon fontSize="small" />
        );

      case "WASTE":
        return (
          <DeleteOutlineOutlinedIcon fontSize="small" />
        );

      default:
        return (
          <MoreHorizIcon fontSize="small" />
        );
    }
  };

  const formatCategory = (
    category: string
  ) => {
    return category
      .toLowerCase()
      .replace(
        /^./,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const getActivityStatus = (
    emission: number
  ) => {
    if (emission > 10) {
      return {
        label: "High Impact",
        bg: "#FFE4E4",
        color: "#EF3030",
      };
    }

    if (emission > 5) {
      return {
        label: "Moderate",
        bg: "#FFF0E2",
        color: "#F27618",
      };
    }

    return {
      label: "Low Impact",
      bg: "#E5F8ED",
      color: "#149447",
    };
  };

  /*
   * =====================================================
   * DASHBOARD PAGE
   *
   * Sidebar + Topbar are intentionally NOT rendered here.
   * They are already provided by DashboardLayout.
   * =====================================================
   */

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F8FAFC",
        color: "#141B2D",
      }}
    >
      <Box
        sx={{
          px: {
            xs: 1.5,
            sm: 2.5,
            lg: 3,
          },
          py: {
            xs: 2,
            md: 2.5,
          },
          maxWidth: 1500,
          mx: "auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Box
          sx={{
            display: "flex",
            flexDirection: {
              xs: "column",
              md: "row",
            },
            justifyContent:
              "space-between",
            alignItems: {
              xs: "flex-start",
              md: "center",
            },
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: {
                  xs: 25,
                  md: 29,
                },
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing:
                  "-0.8px",
              }}
            >
              Dashboard Overview
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: "#657084",
                fontSize: 13.5,
              }}
            >
              Track, Analyze, and
              Reduce – A Smarter
              Sustainability
              Dashboard
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={
              <CalendarMonthOutlinedIcon />
            }
            sx={{
              minWidth: 145,
              height: 38,
              px: 1.5,
              borderRadius: 2.2,
              borderColor:
                "#E1D8FF",
              color: "#5423D4",
              background:
                "#F8F5FF",
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {monthLabel}
          </Button>
        </Box>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            KPI CARDS
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 1.7,
            mb: 2,
          }}
        >
          <MetricCard
            icon={
              <PeopleAltOutlinedIcon />
            }
            iconBg="#E8F8EE"
            iconColor="#149653"
            title="Activities Logged"
            value={String(
              activities.length
            )}
            subtitle="All recorded activities"
            titleColor="#139653"
          />

          <MetricCard
            icon={
              <LocalFireDepartmentOutlinedIcon />
            }
            iconBg="#FFF0E3"
            iconColor="#FF7317"
            title="Avg Daily CO₂"
            value={`${averageDailyCO2} kg`}
            subtitle="Current month"
          />

          <MetricCard
            icon={
              <DevicesOutlinedIcon />
            }
            iconBg="#E9F2FF"
            iconColor="#1675E8"
            title="Categories Used"
            value={String(
              categoriesUsed
            )}
            subtitle="Activity categories"
          />

          <MetricCard
            icon={
              <CloudOutlinedIcon />
            }
            iconBg="#E8F8EE"
            iconColor="#149653"
            title="Total CO₂"
            value={`${totalCO2.toFixed(
              2
            )} kg`}
            subtitle="All logged activities"
            titleColor="#139653"
          />
        </Box>

        {/* =================================================
            CHART + MONTHLY SUMMARY
        ================================================= */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "1.35fr 1fr",
            },
            gap: 1.7,
            mb: 2,
          }}
        >
          {/* =================================================
              CO2 CATEGORY CHART
          ================================================= */}

          <Card
            sx={{
              borderRadius: 3,
              border:
                "1px solid #E5E9EF",
              boxShadow:
                "0 4px 16px rgba(20,30,50,0.035)",
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 1.8,
                  md: 2.3,
                },
                "&:last-child": {
                  pb: 2.3,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  mb: 1,
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 0.7,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 17,
                        fontWeight: 800,
                      }}
                    >
                      CO₂ by Category
                    </Typography>

                    <InfoOutlinedIcon
                      sx={{
                        fontSize: 17,
                        color:
                          "#8A93A3",
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      color:
                        "#687386",
                      fontSize: 12.5,
                      mt: 0.3,
                    }}
                  >
                    Real emissions
                    from your logged
                    activities
                  </Typography>
                </Box>

                <Chip
                  label={`${monthlyCO2.toFixed(
                    1
                  )} kg this month`}
                  sx={{
                    background:
                      "#E8F8EE",
                    color:
                      "#149653",
                    fontWeight: 600,
                    fontSize: 11,
                  }}
                />
              </Box>

              <Box
                sx={{
                  height: 230,
                  display: "flex",
                  alignItems:
                    "flex-end",
                  justifyContent:
                    "space-around",
                  gap: {
                    xs: 0.3,
                    sm: 1.2,
                  },
                  px: {
                    xs: 0,
                    md: 0.5,
                  },
                  pt: 2,
                }}
              >
                {chartData.map(
                  (item) => {
                    const height =
                      item.value === 0
                        ? 7
                        : Math.max(
                            10,
                            (item.value /
                              maxChartValue) *
                              165
                          );

                    const color =
                      categoryColors[
                        item.category
                      ] ||
                      "#9299A8";

                    return (
                      <Box
                        key={
                          item.category
                        }
                        sx={{
                          flex: 1,
                          height:
                            "100%",
                          display:
                            "flex",
                          flexDirection:
                            "column",
                          alignItems:
                            "center",
                          justifyContent:
                            "flex-end",
                          minWidth: 40,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color,
                            mb: 0.6,
                          }}
                        >
                          {item.value.toFixed(
                            1
                          )}{" "}
                          kg
                        </Typography>

                        <Box
                          sx={{
                            width: {
                              xs: "52%",
                              sm: "50%",
                            },
                            maxWidth: 48,
                            height,
                            borderRadius:
                              "6px 6px 3px 3px",
                            background:
                              color,
                            transition:
                              "height .3s ease",
                          }}
                        />

                        <Box
                          sx={{
                            mt: 0.8,
                            color,
                          }}
                        >
                          {getCategoryIcon(
                            item.category
                          )}
                        </Box>

                        <Typography
                          sx={{
                            fontSize: 10.5,
                            color:
                              "#5F6878",
                            mt: 0.2,
                            textAlign:
                              "center",
                          }}
                        >
                          {formatCategory(
                            item.category
                          )}
                        </Typography>
                      </Box>
                    );
                  }
                )}
              </Box>
            </CardContent>
          </Card>

          {/* =================================================
              MONTHLY SUMMARY
          ================================================= */}

          <Card
            sx={{
              borderRadius: 3,
              border:
                "1px solid #E5E9EF",
              boxShadow:
                "0 4px 16px rgba(20,30,50,0.035)",
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 1.8,
                  md: 2.3,
                },
                "&:last-child": {
                  pb: 2.3,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  mb: 1.8,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 17,
                    fontWeight: 800,
                  }}
                >
                  Monthly Summary
                </Typography>

                <Chip
                  label="Live"
                  sx={{
                    background:
                      "#E8F8EE",
                    color:
                      "#149653",
                    fontWeight: 600,
                    borderRadius: 2,
                    height: 27,
                  }}
                />
              </Box>

              <SummaryRow
                label="Activities"
                value={String(
                  monthlyActivities.length
                )}
              />

              <SummaryRow
                label="CO₂ Emissions"
                value={`${monthlyCO2.toFixed(
                  2
                )} kg`}
              />

              <SummaryRow
                label="Daily Average"
                value={`${averageDailyCO2} kg`}
              />

              <SummaryRow
                label="Categories"
                value={String(
                  categoriesUsed
                )}
                last
              />

              <Button
                fullWidth
                variant="contained"
                onClick={() =>
                  navigate(
                    "/activities"
                  )
                }
                sx={{
                  mt: 1.5,
                  py: 1.1,
                  borderRadius: 2,
                  textTransform:
                    "none",
                  fontWeight: 700,
                  background:
                    "#149653",
                  "&:hover": {
                    background:
                      "#087A40",
                  },
                }}
              >
                Manage Activities
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* =================================================
            RECENT ACTIVITIES
        ================================================= */}

        <Card
          sx={{
            borderRadius: 3,
            border:
              "1px solid #E5E9EF",
            boxShadow:
              "0 4px 16px rgba(20,30,50,0.035)",
            overflow: "hidden",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 1.8,
                md: 2.3,
              },
              "&:last-child": {
                pb: 0,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: 1,
                mb: 0.4,
              }}
            >
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 800,
                }}
              >
                Recent Activity Logs
              </Typography>

              <Button
                size="small"
                onClick={() =>
                  navigate(
                    "/activities"
                  )
                }
                sx={{
                  textTransform:
                    "none",
                  color: "#149653",
                  fontWeight: 700,
                }}
              >
                View All
              </Button>
            </Box>

            <Typography
              sx={{
                color: "#687386",
                fontSize: 12.5,
                mt: 0.2,
                mb: 1.4,
              }}
            >
              Latest activity entries
              and their carbon impact
            </Typography>

            {loading ? (
              <Box
                sx={{
                  py: 5,
                  display: "flex",
                  justifyContent:
                    "center",
                }}
              >
                <CircularProgress
                  size={28}
                  sx={{
                    color: "#159653",
                  }}
                />
              </Box>
            ) : activities.length === 0 ? (
              <Box
                sx={{
                  py: 5,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  No activity logs yet
                </Typography>

                <Typography
                  sx={{
                    color: "#687386",
                    fontSize: 13,
                    mt: 0.5,
                  }}
                >
                  Start logging
                  activities to see
                  your carbon
                  footprint here.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() =>
                    navigate(
                      "/activities"
                    )
                  }
                  sx={{
                    mt: 2,
                    textTransform:
                      "none",
                    background:
                      "#149653",
                    "&:hover": {
                      background:
                        "#087A40",
                    },
                  }}
                >
                  Log Activity
                </Button>
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
                    minWidth: 850,
                  }}
                >
                  {/* TABLE HEADER */}

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns:
                        "90px 1.1fr 1.3fr 1fr 90px 105px 100px",
                      alignItems:
                        "center",
                      minHeight: 40,
                      px: 1,
                      background:
                        "#FAFBFD",
                      borderTop:
                        "1px solid #EEF0F4",
                      borderBottom:
                        "1px solid #EEF0F4",
                    }}
                  >
                    {[
                      "Log ID",
                      "User",
                      "Activity",
                      "Category",
                      "CO₂ (kg)",
                      "Date",
                      "Impact",
                    ].map(
                      (heading) => (
                        <Typography
                          key={
                            heading
                          }
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              "#566174",
                          }}
                        >
                          {heading}
                        </Typography>
                      )
                    )}
                  </Box>

                  {/* ROWS */}

                  {activities
                    .slice(0, 5)
                    .map(
                      (
                        activity,
                        index
                      ) => {
                        const status =
                          getActivityStatus(
                            Number(
                              activity.co2Emission
                            )
                          );

                        return (
                          <Box
                            key={
                              activity._id
                            }
                            sx={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "90px 1.1fr 1.3fr 1fr 90px 105px 100px",
                              alignItems:
                                "center",
                              minHeight: 54,
                              px: 1,
                              borderBottom:
                                "1px solid #EEF0F4",
                              transition:
                                "background .15s ease",
                              "&:hover":
                                {
                                  background:
                                    "#FAFCFB",
                                },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                color:
                                  "#5226D8",
                              }}
                            >
                              ACT-
                              {String(
                                index + 1
                              ).padStart(
                                3,
                                "0"
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 12,
                                color:
                                  "#374151",
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                pr: 1,
                              }}
                            >
                              You
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 12,
                                color:
                                  "#202938",
                                fontWeight: 500,
                                whiteSpace:
                                  "nowrap",
                                overflow:
                                  "hidden",
                                textOverflow:
                                  "ellipsis",
                                pr: 1,
                              }}
                            >
                              {formatActivityName(
                                activity
                              )}{" "}
                              (
                              {
                                activity.quantity
                              }{" "}
                              {
                                activity.unit
                              }
                              )
                            </Typography>

                            <Box
                              sx={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: 0.6,
                                color:
                                  "#364152",
                                minWidth: 0,
                              }}
                            >
                              {getCategoryIcon(
                                activity.category
                              )}

                              <Typography
                                sx={{
                                  fontSize: 12,
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {formatCategory(
                                  activity.category
                                )}
                              </Typography>
                            </Box>

                            <Typography
                              sx={{
                                fontSize: 12,
                                color:
                                  "#374151",
                                fontWeight: 600,
                              }}
                            >
                              {Number(
                                activity.co2Emission
                              ).toFixed(
                                2
                              )}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: 11.5,
                                color:
                                  "#374151",
                              }}
                            >
                              {formatDate(
                                activity.date
                              )}
                            </Typography>

                            <Chip
                              label={
                                status.label
                              }
                              sx={{
                                width:
                                  "fit-content",
                                height: 25,
                                fontSize: 10,
                                fontWeight: 600,
                                background:
                                  status.bg,
                                color:
                                  status.color,
                                borderRadius:
                                  1.5,
                              }}
                            />
                          </Box>
                        );
                      }
                    )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* =================================================
            FOOTER
        ================================================= */}

        <Typography
          sx={{
            textAlign: "center",
            color: "#536074",
            fontSize: 11.5,
            mt: 1.8,
            pb: 1,
          }}
        >
          © 2026 CarbonTrack.
          All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

/* =====================================================
   SUMMARY ROW
===================================================== */

interface SummaryRowProps {
  label: string;
  value: string;
  last?: boolean;
}

const SummaryRow = ({
  label,
  value,
  last = false,
}: SummaryRowProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        py: 1.35,
        borderBottom: last
          ? "none"
          : "1px solid #EEF0F4",
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: "#687386",
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 800,
          color: "#172033",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/* =====================================================
   KPI CARD
===================================================== */

interface MetricCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  value: string;
  subtitle: string;
  titleColor?: string;
}

const MetricCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  subtitle,
  titleColor,
}: MetricCardProps) => {
  return (
    <Card
      sx={{
        minHeight: 130,
        borderRadius: 3,
        border:
          "1px solid #E5E9EF",
        boxShadow:
          "0 4px 16px rgba(20,30,50,0.035)",
        transition:
          "transform .2s ease, box-shadow .2s ease",
        "&:hover": {
          transform:
            "translateY(-2px)",
          boxShadow:
            "0 8px 24px rgba(20,30,50,0.07)",
        },
      }}
    >
      <CardContent
        sx={{
          p: 1.9,
          "&:last-child": {
            pb: 1.9,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems:
              "flex-start",
            gap: 1.3,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              flexShrink: 0,
              borderRadius:
                "50%",
              background:
                iconBg,
              color:
                iconColor,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
            }}
          >
            {icon}
          </Box>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color:
                  titleColor ||
                  "#46546C",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                fontSize: 24,
                lineHeight: 1.2,
                fontWeight: 800,
                letterSpacing:
                  "-0.6px",
                mt: 0.4,
                color:
                  "#111827",
              }}
            >
              {value}
            </Typography>

            <Typography
              sx={{
                fontSize: 11,
                color:
                  "#657084",
                mt: 0.6,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
