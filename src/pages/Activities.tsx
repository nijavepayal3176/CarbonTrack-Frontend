 import { useEffect, useState } from "react";

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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import Co2OutlinedIcon from "@mui/icons-material/Co2Outlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";

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

interface EmissionFactor {
  unit: string;
  factor: number;
}

const categories = [
  "TRANSPORT",
  "ENERGY",
  "ELECTRICITY",
  "FOOD",
  "SHOPPING",
  "WASTE",
  "OTHER",
];

const activityOptions: Record<string, string[]> = {
  TRANSPORT: [
    "Car",
    "Bus",
    "Train",
    "Bike",
    "Walking",
  ],

  ENERGY: [
    "LPG",
    "NaturalGas",
  ],

  ELECTRICITY: [
    "Electricity",
  ],

  FOOD: [
    "VegetarianMeal",
    "VeganMeal",
    "MeatMeal",
  ],

  SHOPPING: [
    "Clothing",
    "Electronics",
  ],

  WASTE: [
    "GeneralWaste",
    "RecycledWaste",
  ],

  OTHER: [
    "Other",
  ],
};

/*
|--------------------------------------------------------------------------
| LIVE EMISSION FACTORS
|--------------------------------------------------------------------------
| These values exactly match backend/utils/emissionFactors.ts
|
| Actual saved CO2 is ALWAYS calculated by backend.
| These values are only used for instant frontend preview.
|--------------------------------------------------------------------------
*/

const liveEmissionFactors: Record<
  string,
  Record<string, EmissionFactor>
> = {
  TRANSPORT: {
    Car: {
      unit: "km",
      factor: 0.192,
    },

    Bus: {
      unit: "km",
      factor: 0.089,
    },

    Train: {
      unit: "km",
      factor: 0.041,
    },

    Bike: {
      unit: "km",
      factor: 0.021,
    },

    Walking: {
      unit: "km",
      factor: 0,
    },
  },

  ELECTRICITY: {
    Electricity: {
      unit: "kWh",
      factor: 0.82,
    },
  },

  ENERGY: {
    LPG: {
      unit: "kg",
      factor: 3.0,
    },

    NaturalGas: {
      unit: "m³",
      factor: 2.0,
    },
  },

  FOOD: {
    VegetarianMeal: {
      unit: "meal",
      factor: 0.7,
    },

    VeganMeal: {
      unit: "meal",
      factor: 0.5,
    },

    MeatMeal: {
      unit: "meal",
      factor: 3.3,
    },
  },

  SHOPPING: {
    Clothing: {
      unit: "item",
      factor: 8.0,
    },

    Electronics: {
      unit: "item",
      factor: 20.0,
    },
  },

  WASTE: {
    GeneralWaste: {
      unit: "kg",
      factor: 0.5,
    },

    RecycledWaste: {
      unit: "kg",
      factor: 0.1,
    },
  },

  OTHER: {
    Other: {
      unit: "unit",
      factor: 1.0,
    },
  },
};

const Activities = () => {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [category, setCategory] =
    useState("TRANSPORT");

  const [activityType, setActivityType] =
    useState("Car");

  const [quantity, setQuantity] =
    useState("");

  const [date, setDate] =
    useState(
      new Date()
        .toISOString()
        .split("T")[0]
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | LOAD ACTIVITIES
  |--------------------------------------------------------------------------
  */

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/activities");

      setActivities(
        response.data.data.activities
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load activities."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CATEGORY CHANGE
  |--------------------------------------------------------------------------
  */

  const handleCategoryChange = (
    value: string
  ) => {
    setCategory(value);

    const firstActivity =
      activityOptions[value]?.[0] || "";

    setActivityType(firstActivity);

    /*
     * Clear quantity so user can enter
     * fresh quantity for new unit.
     */
    setQuantity("");
  };

  /*
  |--------------------------------------------------------------------------
  | SELECTED EMISSION FACTOR
  |--------------------------------------------------------------------------
  */

  const selectedFactor =
    liveEmissionFactors[category]?.[
      activityType
    ];

  const selectedUnit =
    selectedFactor?.unit || "unit";

  const emissionFactor =
    selectedFactor?.factor ?? 0;

  /*
  |--------------------------------------------------------------------------
  | LIVE CARBON CALCULATION
  |--------------------------------------------------------------------------
  */

  const numericQuantity =
    Number(quantity);

  const liveCO2 =
    Number.isFinite(numericQuantity) &&
    numericQuantity > 0
      ? Number(
          (
            numericQuantity *
            emissionFactor
          ).toFixed(3)
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (
        !quantity ||
        Number(quantity) <= 0
      ) {
        setError(
          "Please enter a valid quantity greater than 0."
        );

        setSaving(false);
        return;
      }

      if (!selectedFactor) {
        setError(
          "Unable to calculate carbon for this activity."
        );

        setSaving(false);
        return;
      }

      const payload = {
        category,
        activityType,
        quantity: Number(quantity),
        date,
      };

      /*
       * IMPORTANT:
       * Do NOT send co2Emission from frontend.
       *
       * Backend calculates:
       *
       * quantity × emissionFactor
       *
       * and stores the final value.
       */

      if (editingId) {
        await api.put(
          `/activities/${editingId}`,
          payload
        );

        setSuccess(
          "Activity updated successfully."
        );
      } else {
        await api.post(
          "/activities",
          payload
        );

        setSuccess(
          "Activity logged successfully."
        );
      }

      resetForm();

      await loadActivities();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to save activity."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (
    activity: Activity
  ) => {
    setEditingId(activity._id);

    setCategory(
      activity.category
    );

    setActivityType(
      activity.activityType
    );

    setQuantity(
      String(activity.quantity)
    );

    setDate(
      new Date(activity.date)
        .toISOString()
        .split("T")[0]
    );

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this activity?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/activities/${id}`
      );

      setSuccess(
        "Activity deleted successfully."
      );

      await loadActivities();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to delete activity."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RESET FORM
  |--------------------------------------------------------------------------
  */

  const resetForm = () => {
    setEditingId(null);

    setCategory("TRANSPORT");

    setActivityType("Car");

    setQuantity("");

    setDate(
      new Date()
        .toISOString()
        .split("T")[0]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | TOTAL CO2
  |--------------------------------------------------------------------------
  */

  const totalCO2 =
    activities.reduce(
      (total, activity) =>
        total +
        Number(activity.co2Emission || 0),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | AVERAGE CO2
  |--------------------------------------------------------------------------
  */

  const averageCO2 =
    activities.length > 0
      ? totalCO2 / activities.length
      : 0;

  /*
  |--------------------------------------------------------------------------
  | CATEGORY ICON
  |--------------------------------------------------------------------------
  */

  const getCategoryIcon = (
    value: string
  ) => {
    switch (value) {
      case "TRANSPORT":
        return (
          <DirectionsCarOutlinedIcon />
        );

      case "ENERGY":
      case "ELECTRICITY":
        return (
          <BoltOutlinedIcon />
        );

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

  /*
  |--------------------------------------------------------------------------
  | CATEGORY COLOR
  |--------------------------------------------------------------------------
  */

  const getCategoryColor = (
    value: string
  ) => {
    switch (value) {
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(180deg, #F7FAF8 0%, #F3F7F4 100%)",
        p: {
          xs: 1.5,
          sm: 2.5,
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
            PAGE HEADER
        ===================================================== */}

        <Box
          sx={{
            mb: {
              xs: 2.5,
              md: 4,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
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
                      "0 0 0 5px rgba(22,128,79,0.10)",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: "#16804F",
                    letterSpacing: 1.2,
                    textTransform:
                      "uppercase",
                  }}
                >
                  Carbon activity tracker
                </Typography>
              </Stack>

              <Typography
                sx={{
                  fontSize: {
                    xs: 30,
                    sm: 34,
                    md: 40,
                  },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing:
                    "-1.4px",
                  color: "#17221C",
                }}
              >
                Activities
              </Typography>

              <Typography
                sx={{
                  mt: 0.8,
                  color: "#718078",
                  fontSize: {
                    xs: 13,
                    sm: 14,
                  },
                  lineHeight: 1.6,
                  maxWidth: 560,
                }}
              >
                Track your everyday activities,
                understand your carbon impact,
                and make more sustainable choices.
              </Typography>
            </Box>

            {/* Total impact */}

            <Box
              sx={{
                px: 2,
                py: 1.3,
                borderRadius: "16px",
                background:
                  "linear-gradient(135deg, #E8F5EE 0%, #DFF2E8 100%)",
                border:
                  "1px solid #D2EBDD",
                width: {
                  xs: "100%",
                  sm: "auto",
                },
                boxSizing: "border-box",
              }}
            >
              <Stack
                direction="row"
                spacing={1.2}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    backgroundColor:
                      "#FFFFFF",
                    color: "#16804F",
                    boxShadow:
                      "0 5px 15px rgba(22,128,79,0.08)",
                  }}
                >
                  <Co2OutlinedIcon
                    sx={{
                      fontSize: 21,
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#6B7B72",
                      textTransform:
                        "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    Total impact
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: "#16804F",
                      lineHeight: 1.2,
                    }}
                  >
                    {totalCO2.toFixed(2)} kg CO₂
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <Alert
            severity="error"
            onClose={() =>
              setError("")
            }
            sx={{
              mb: 2,
              borderRadius: "14px",
              fontSize: 13,
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccess("")
            }
            icon={
              <CheckCircleOutlineRoundedIcon />
            }
            sx={{
              mb: 2,
              borderRadius: "14px",
              fontSize: 13,
            }}
          >
            {success}
          </Alert>
        )}

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
            mb: {
              xs: 2.5,
              md: 3,
            },
          }}
        >
          {/* Activities */}

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
                  "1px solid #E4ECE7",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    sm: 2.3,
                  },
                  "&:last-child": {
                    pb: {
                      xs: 2,
                      sm: 2.3,
                    },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius:
                        "13px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#16804F",
                      background:
                        "#E8F5EE",
                    }}
                  >
                    <TrackChangesOutlinedIcon />
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
                        fontSize: 22,
                        fontWeight: 900,
                        color:
                          "#17221C",
                      }}
                    >
                      {activities.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* CO2 */}

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
                  "1px solid #E4ECE7",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    sm: 2.3,
                  },
                  "&:last-child": {
                    pb: {
                      xs: 2,
                      sm: 2.3,
                    },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius:
                        "13px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#C65D45",
                      background:
                        "#FBEDE9",
                    }}
                  >
                    <Co2OutlinedIcon />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      CO₂ emissions
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 21,
                        fontWeight: 900,
                        color:
                          "#17221C",
                      }}
                    >
                      {totalCO2.toFixed(2)}

                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          fontSize: 11,
                          color:
                            "#819088",
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

          {/* Average */}

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
                  "1px solid #E4ECE7",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    sm: 2.3,
                  },
                  "&:last-child": {
                    pb: {
                      xs: 2,
                      sm: 2.3,
                    },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius:
                        "13px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#6B5CC5",
                      background:
                        "#F0EEFA",
                    }}
                  >
                    <TrendingDownOutlinedIcon />
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
                        fontSize: 21,
                        fontWeight: 900,
                        color:
                          "#17221C",
                      }}
                    >
                      {averageCO2.toFixed(
                        2
                      )}

                      <Box
                        component="span"
                        sx={{
                          ml: 0.5,
                          fontSize: 11,
                          color:
                            "#819088",
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

          {/* Status */}

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
                  "1px solid #E4ECE7",
                backgroundColor:
                  "#FFFFFF",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent
                sx={{
                  p: {
                    xs: 2,
                    sm: 2.3,
                  },
                  "&:last-child": {
                    pb: {
                      xs: 2,
                      sm: 2.3,
                    },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      borderRadius:
                        "13px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#16804F",
                      background:
                        "#E8F5EE",
                    }}
                  >
                    <CheckCircleOutlineRoundedIcon />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Tracking status
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.2,
                        fontSize: 16,
                        fontWeight: 900,
                        color:
                          "#16804F",
                      }}
                    >
                      Active
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* =====================================================
            LOG ACTIVITY FORM
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            borderRadius: {
              xs: "20px",
              md: "24px",
            },
            mb: {
              xs: 2.5,
              md: 3,
            },
            border:
              "1px solid #E2EAE5",
            backgroundColor:
              "#FFFFFF",
            boxShadow:
              "0 12px 38px rgba(20,80,50,0.065)",
            overflow: "hidden",
          }}
        >
          {/* Form header */}

          <Box
            sx={{
              px: {
                xs: 2,
                sm: 3,
                md: 3.5,
              },
              py: {
                xs: 2,
                sm: 2.5,
              },
              background:
                "linear-gradient(135deg, #F8FCF9 0%, #EFF8F2 100%)",
              borderBottom:
                "1px solid #E7EFEA",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius:
                    "14px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color: "#FFFFFF",
                  background:
                    "linear-gradient(135deg, #16804F 0%, #0F6B40 100%)",
                  boxShadow:
                    "0 8px 18px rgba(22,128,79,0.18)",
                }}
              >
                {editingId ? (
                  <EditOutlinedIcon />
                ) : (
                  <AddIcon />
                )}
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 17,
                      sm: 19,
                    },
                    fontWeight: 900,
                    color:
                      "#17221C",
                  }}
                >
                  {editingId
                    ? "Edit Activity"
                    : "Log New Activity"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 12,
                    color: "#7A8981",
                  }}
                >
                  {editingId
                    ? "Update the details of your activity."
                    : "Record an activity and see its carbon impact instantly."}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
                md: 3.5,
              },
              "&:last-child": {
                pb: {
                  xs: 2,
                  sm: 3,
                  md: 3.5,
                },
              },
            }}
          >
            <Grid
              container
              spacing={{
                xs: 2,
                sm: 2.5,
              }}
            >
              {/* Category */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={category}
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "14px",
                        backgroundColor:
                          "#FBFCFB",

                        "&:hover fieldset":
                          {
                            borderColor:
                              "#A8CBB7",
                          },

                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                          },
                      },

                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                >
                  {categories.map(
                    (item) => (
                      <MenuItem
                        key={item}
                        value={item}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems:
                              "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius:
                                "9px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                getCategoryColor(
                                  item
                                ),
                              backgroundColor:
                                `${getCategoryColor(
                                  item
                                )}15`,
                            }}
                          >
                            {getCategoryIcon(
                              item
                            )}
                          </Box>

                          <Typography
                            sx={{
                              fontSize:
                                13,
                              fontWeight:
                                700,
                            }}
                          >
                            {item}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    )
                  )}
                </TextField>
              </Grid>

              {/* Activity Type */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Activity Type"
                  value={activityType}
                  onChange={(event) =>
                    setActivityType(
                      event.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "14px",
                        backgroundColor:
                          "#FBFCFB",

                        "&:hover fieldset":
                          {
                            borderColor:
                              "#A8CBB7",
                          },

                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                          },
                      },

                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                >
                  {(
                    activityOptions[
                      category
                    ] || []
                  ).map((item) => (
                    <MenuItem
                      key={item}
                      value={item}
                    >
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Quantity */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  fullWidth
                  type="number"
                  label={`Quantity (${selectedUnit})`}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "any",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root":
                      {
                        borderRadius:
                          "14px",
                        backgroundColor:
                          "#FBFCFB",

                        "&:hover fieldset":
                          {
                            borderColor:
                              "#A8CBB7",
                          },

                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                          },
                      },

                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color:
                          "#16804F",
                      },
                  }}
                />
              </Grid>

              {/* Date */}

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(event) =>
                    setDate(
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
                          "14px",
                        backgroundColor:
                          "#FBFCFB",

                        "&:hover fieldset":
                          {
                            borderColor:
                              "#A8CBB7",
                          },

                        "&.Mui-focused fieldset":
                          {
                            borderColor:
                              "#16804F",
                          },
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

            {/* =================================================
                LIVE CARBON CALCULATION
            ================================================= */}

            <Box
              sx={{
                mt: 3,
                p: {
                  xs: 2,
                  sm: 2.5,
                },
                borderRadius:
                  "18px",
                background:
                  "linear-gradient(135deg, #E8F5EE 0%, #F4FAF6 100%)",
                border:
                  "1px solid #D5EBDD",
                position:
                  "relative",
                overflow:
                  "hidden",
              }}
            >
              {/* Decorative circle */}

              <Box
                sx={{
                  position:
                    "absolute",
                  right: -25,
                  top: -30,
                  width: 110,
                  height: 110,
                  borderRadius:
                    "50%",
                  background:
                    "rgba(22,128,79,0.06)",
                }}
              />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                  justifyContent:
                    "space-between",
                  position:
                    "relative",
                  zIndex: 1,
                }}
              >
                {/* Calculation info */}

                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems:
                      "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      minWidth: 48,
                      borderRadius:
                        "15px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color:
                        "#16804F",
                      backgroundColor:
                        "#FFFFFF",
                      boxShadow:
                        "0 6px 18px rgba(22,128,79,0.10)",
                    }}
                  >
                    <SpeedOutlinedIcon
                      sx={{
                        fontSize: 25,
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight:
                          900,
                        color:
                          "#6C7C73",
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          0.8,
                      }}
                    >
                      Live Carbon Calculation
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        fontSize: 13,
                        color:
                          "#819088",
                      }}
                    >
                      {quantity &&
                      Number(quantity) >
                        0
                        ? `${quantity} ${selectedUnit} × ${emissionFactor} kg CO₂/${selectedUnit}`
                        : "Enter quantity to calculate your carbon impact"}
                    </Typography>
                  </Box>
                </Stack>

                {/* Live result */}

                <Box
                  sx={{
                    minWidth: {
                      xs: "100%",
                      sm: 190,
                    },
                    px: 2,
                    py: 1.4,
                    borderRadius:
                      "14px",
                    backgroundColor:
                      "#FFFFFF",
                    border:
                      "1px solid #D9EDE1",
                    textAlign: {
                      xs: "left",
                      sm: "center",
                    },
                    boxSizing:
                      "border-box",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight:
                        800,
                      color:
                        "#7A8981",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        0.7,
                    }}
                  >
                    Estimated CO₂
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.25,
                      fontSize: {
                        xs: 22,
                        sm: 25,
                      },
                      fontWeight:
                        900,
                      color:
                        "#16804F",
                      lineHeight:
                        1.2,
                    }}
                  >
                    {liveCO2.toFixed(
                      2
                    )}{" "}
                    kg
                  </Typography>

                  {quantity &&
                    Number(quantity) >
                      0 && (
                      <Typography
                        sx={{
                          mt: 0.4,
                          fontSize: 9.5,
                          color:
                            "#7A9183",
                          fontWeight:
                            700,
                        }}
                      >
                        {emissionFactor} kg
                        CO₂ /{" "}
                        {selectedUnit}
                      </Typography>
                    )}
                </Box>
              </Stack>
            </Box>

            {/* =================================================
                FORM FOOTER
            ================================================= */}

            <Box
              sx={{
                mt: 3,
                pt: 2.5,
                borderTop:
                  "1px solid #EDF2EE",
              }}
            >
              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                spacing={1.5}
                sx={{
                  justifyContent:
                    "flex-end",
                }}
              >
                {editingId && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={resetForm}
                    sx={{
                      minWidth: {
                        sm: 120,
                      },
                      height: 48,
                      borderRadius:
                        "13px",
                      textTransform:
                        "none",
                      fontWeight: 800,
                      borderColor:
                        "#D7E2DC",
                      color:
                        "#5F7067",

                      "&:hover": {
                        borderColor:
                          "#A8CBB7",
                        backgroundColor:
                          "#F6FAF7",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                  sx={{
                    minWidth: {
                      sm: 170,
                    },
                    height: 48,
                    px: 3,
                    borderRadius:
                      "13px",
                    textTransform:
                      "none",
                    fontWeight: 900,
                    background:
                      "linear-gradient(135deg, #16804F 0%, #0F6B40 100%)",
                    boxShadow:
                      "0 10px 24px rgba(22,128,79,0.20)",

                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #0F6B40 0%, #0A5935 100%)",
                      transform:
                        "translateY(-1px)",
                      boxShadow:
                        "0 14px 28px rgba(22,128,79,0.25)",
                    },

                    "&:disabled": {
                      background:
                        "#A8CBB7",
                      color:
                        "#FFFFFF",
                    },
                  }}
                >
                  {saving ? (
                    <CircularProgress
                      size={21}
                      color="inherit"
                    />
                  ) : editingId ? (
                    "Update Activity"
                  ) : (
                    "Log Activity"
                  )}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* =====================================================
            RECENT ACTIVITIES
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            borderRadius: {
              xs: "20px",
              md: "24px",
            },
            border:
              "1px solid #E2EAE5",
            backgroundColor:
              "#FFFFFF",
            boxShadow:
              "0 12px 38px rgba(20,80,50,0.065)",
            overflow: "hidden",
          }}
        >
          {/* List header */}

          <Box
            sx={{
              px: {
                xs: 2,
                sm: 3,
                md: 3.5,
              },
              py: {
                xs: 2,
                sm: 2.5,
              },
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
                <Typography
                  sx={{
                    fontSize: {
                      xs: 18,
                      sm: 20,
                    },
                    fontWeight:
                      900,
                    color:
                      "#17221C",
                  }}
                >
                  Recent Activities
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: 12,
                    color:
                      "#819088",
                  }}
                >
                  Your latest carbon footprint entries
                </Typography>
              </Box>

              <Chip
                label={`${activities.length} ${
                  activities.length === 1
                    ? "activity"
                    : "activities"
                }`}
                size="small"
                sx={{
                  backgroundColor:
                    "#F1F6F3",
                  color:
                    "#5F7067",
                  fontWeight:
                    800,
                  borderRadius:
                    "9px",
                }}
              />
            </Stack>
          </Box>

          <Divider
            sx={{
              borderColor:
                "#EDF2EE",
            }}
          />

          {/* Loading */}

          {loading ? (
            <Box
              sx={{
                display:
                  "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                py: 8,
              }}
            >
              <CircularProgress
                size={32}
                thickness={4}
                sx={{
                  color:
                    "#16804F",
                }}
              />

              <Typography
                sx={{
                  mt: 2,
                  fontSize: 13,
                  color:
                    "#819088",
                  fontWeight:
                    600,
                }}
              >
                Loading your activities...
              </Typography>
            </Box>
          ) : activities.length ===
            0 ? (
            /* Empty state */

            <Box
              sx={{
                textAlign:
                  "center",
                py: {
                  xs: 6,
                  sm: 8,
                },
                px: 2,
              }}
            >
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  mx: "auto",
                  borderRadius:
                    "22px",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  color:
                    "#16804F",
                  background:
                    "#E8F5EE",
                }}
              >
                <TrackChangesOutlinedIcon
                  sx={{
                    fontSize: 34,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  mt: 2,
                  fontSize: 17,
                  fontWeight:
                    900,
                  color:
                    "#17221C",
                }}
              >
                No activities yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 13,
                  lineHeight:
                    1.6,
                  color:
                    "#819088",
                  maxWidth: 420,
                  mx: "auto",
                }}
              >
                Log your first activity above
                to start tracking your carbon
                footprint and sustainability progress.
              </Typography>
            </Box>
          ) : (
            /* Activity list */

            <Stack>
              {activities.map(
                (
                  activity,
                  index
                ) => {
                  const categoryColor =
                    getCategoryColor(
                      activity.category
                    );

                  return (
                    <Box
                      key={
                        activity._id
                      }
                      sx={{
                        px: {
                          xs: 1.5,
                          sm: 2.5,
                          md: 3.5,
                        },
                        py: {
                          xs: 1.8,
                          sm: 2.2,
                        },
                        transition:
                          "all 0.2s ease",

                        "&:hover": {
                          backgroundColor:
                            "#FAFCFA",
                        },
                      }}
                    >
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={{
                          xs: 1.5,
                          sm: 2,
                        }}
                        sx={{
                          alignItems: {
                            xs: "stretch",
                            sm: "center",
                          },
                          justifyContent:
                            "space-between",
                        }}
                      >
                        {/* Left */}

                        <Stack
                          direction="row"
                          spacing={1.5}
                          sx={{
                            alignItems:
                              "center",
                            minWidth: 0,
                          }}
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
                              minWidth: {
                                xs: 44,
                                sm: 48,
                              },
                              borderRadius:
                                "14px",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              color:
                                categoryColor,
                              backgroundColor:
                                `${categoryColor}12`,
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
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems:
                                  "center",
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: {
                                    xs: 14,
                                    sm: 15,
                                  },
                                  fontWeight:
                                    900,
                                  color:
                                    "#17221C",
                                  overflowWrap:
                                    "anywhere",
                                }}
                              >
                                {
                                  activity.activityType
                                }
                              </Typography>

                              <Chip
                                label={
                                  activity.category
                                }
                                size="small"
                                sx={{
                                  height: 22,
                                  borderRadius:
                                    "7px",
                                  fontSize:
                                    9,
                                  fontWeight:
                                    900,
                                  color:
                                    categoryColor,
                                  backgroundColor:
                                    `${categoryColor}12`,
                                }}
                              />
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={0.8}
                              sx={{
                                alignItems:
                                  "center",
                                mt: 0.5,
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize:
                                    11.5,
                                  color:
                                    "#819088",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {
                                  activity.quantity
                                }{" "}
                                {
                                  activity.unit
                                }
                              </Typography>

                              <Typography
                                sx={{
                                  color:
                                    "#C1CAC5",
                                }}
                              >
                                •
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={0.4}
                                sx={{
                                  alignItems:
                                    "center",
                                }}
                              >
                                <CalendarTodayOutlinedIcon
                                  sx={{
                                    fontSize:
                                      12,
                                    color:
                                      "#9AA69F",
                                  }}
                                />

                                <Typography
                                  sx={{
                                    fontSize:
                                      11.5,
                                    color:
                                      "#819088",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  {new Date(
                                    activity.date
                                  ).toLocaleDateString()}
                                </Typography>
                              </Stack>

                              <Typography
                                sx={{
                                  color:
                                    "#C1CAC5",
                                }}
                              >
                                •
                              </Typography>

                              <Stack
                                direction="row"
                                spacing={0.4}
                                sx={{
                                  alignItems:
                                    "center",
                                }}
                              >
                                <AccessTimeRoundedIcon
                                  sx={{
                                    fontSize:
                                      13,
                                    color:
                                      "#9AA69F",
                                  }}
                                />

                                <Typography
                                  sx={{
                                    fontSize:
                                      11.5,
                                    color:
                                      "#819088",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  Logged
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>
                        </Stack>

                        {/* Right */}

                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{
                            alignItems:
                              "center",
                            justifyContent: {
                              xs: "space-between",
                              sm: "flex-end",
                            },
                            pl: {
                              xs: 7.5,
                              sm: 0,
                            },
                          }}
                        >
                          {/* CO2 */}

                          <Box
                            sx={{
                              px: 1.4,
                              py: 0.8,
                              borderRadius:
                                "11px",
                              background:
                                "#E8F5EE",
                              border:
                                "1px solid #D9EDE1",
                              minWidth: 105,
                              textAlign:
                                "center",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  14,
                                fontWeight:
                                  900,
                                color:
                                  "#16804F",
                                lineHeight:
                                  1.2,
                              }}
                            >
                              {Number(
                                activity.co2Emission
                              ).toFixed(
                                2
                              )}{" "}
                              kg
                            </Typography>

                            <Typography
                              sx={{
                                mt: 0.2,
                                fontSize:
                                  8.5,
                                fontWeight:
                                  800,
                                color:
                                  "#7A9183",
                                textTransform:
                                  "uppercase",
                                letterSpacing:
                                  0.5,
                              }}
                            >
                              CO₂ impact
                            </Typography>
                          </Box>

                          {/* Edit */}

                          <IconButton
                            onClick={() =>
                              handleEdit(
                                activity
                              )
                            }
                            aria-label="Edit activity"
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius:
                                "11px",
                              color:
                                "#66766D",
                              border:
                                "1px solid #E3EBE6",
                              backgroundColor:
                                "#FFFFFF",

                              "&:hover": {
                                color:
                                  "#16804F",
                                backgroundColor:
                                  "#E8F5EE",
                                borderColor:
                                  "#CDE4D6",
                              },
                            }}
                          >
                            <EditOutlinedIcon
                              sx={{
                                fontSize:
                                  19,
                              }}
                            />
                          </IconButton>

                          {/* Delete */}

                          <IconButton
                            onClick={() =>
                              handleDelete(
                                activity._id
                              )
                            }
                            aria-label="Delete activity"
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius:
                                "11px",
                              color:
                                "#A26B67",
                              border:
                                "1px solid #F0E2E0",
                              backgroundColor:
                                "#FFFFFF",

                              "&:hover": {
                                color:
                                  "#C44942",
                                backgroundColor:
                                  "#FFF3F1",
                                borderColor:
                                  "#F1CFCA",
                              },
                            }}
                          >
                            <DeleteIcon
                              sx={{
                                fontSize:
                                  19,
                              }}
                            />
                          </IconButton>
                        </Stack>
                      </Stack>

                      {index <
                        activities.length -
                          1 && (
                        <Divider
                          sx={{
                            mt: {
                              xs: 1.8,
                              sm: 2.2,
                            },
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
          )}
        </Card>

        {/* =====================================================
            BOTTOM INFO
        ===================================================== */}

        {activities.length > 0 && (
          <Box
            sx={{
              mt: 2,
              px: {
                xs: 1,
                sm: 0,
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <Co2OutlinedIcon
                sx={{
                  fontSize: 15,
                  color:
                    "#A0ABA4",
                }}
              />

              <Typography
                sx={{
                  fontSize: 10.5,
                  color:
                    "#A0ABA4",
                  textAlign:
                    "center",
                }}
              >
                Live preview is calculated instantly.
                Final CO₂ is securely calculated by
                the backend when you save the activity.
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Activities;