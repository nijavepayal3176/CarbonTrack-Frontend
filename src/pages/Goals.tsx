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
  IconButton,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";

import type { ReactNode } from "react";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import Co2OutlinedIcon from "@mui/icons-material/Co2Outlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

import api from "../services/api";

/* =========================================================
   SAFE STACK
   ---------------------------------------------------------
   This wrapper avoids the MUI Stack typing issue in the
   current project while preserving the same UI behavior.
========================================================= */

type ResponsiveValue<T> =
  | T
  | {
      xs?: T;
      sm?: T;
      md?: T;
      lg?: T;
      xl?: T;
    };

interface SafeStackProps {
  children?: ReactNode;
  direction?: ResponsiveValue<
    "row" | "row-reverse" | "column" | "column-reverse"
  >;
  spacing?: number;
  alignItems?: ResponsiveValue<string>;
  justifyContent?: ResponsiveValue<string>;
  flexWrap?: ResponsiveValue<
    "nowrap" | "wrap" | "wrap-reverse"
  >;
  sx?: Record<string, unknown>;
}

const SafeStack = ({
  children,
  direction = "column",
  spacing = 0,
  alignItems,
  justifyContent,
  flexWrap,
  sx = {},
}: SafeStackProps) => {
  const responsiveSx = {
    display: "flex",
    flexDirection: direction,
    gap: spacing,
    alignItems,
    justifyContent,
    flexWrap,
    ...sx,
  };

  return <Box sx={responsiveSx}>{children}</Box>;
};

/* =========================================================
   TYPES
========================================================= */

interface Goal {
  _id: string;
  title: string;
  description?: string;
  baselineCO2: number;
  targetReduction: number;
  targetCO2: number;
  currentCO2: number;
  progress: number;
  startDate: string;
  targetDate: string;
  status: "ACTIVE" | "COMPLETED" | "EXPIRED";
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================
   COMPONENT
========================================================= */

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baselineCO2, setBaselineCO2] = useState("");
  const [targetReduction, setTargetReduction] = useState("");

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [targetDate, setTargetDate] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     LOAD GOALS
  ========================================================= */

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/goals");

      setGoals(response.data?.data?.goals || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load your goals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  /* =========================================================
     NUMERIC VALUES
  ========================================================= */

  const numericBaseline = Number(baselineCO2);
  const numericReduction = Number(targetReduction);

  const previewTargetCO2 =
    Number.isFinite(numericBaseline) &&
    Number.isFinite(numericReduction) &&
    numericBaseline >= 0 &&
    numericReduction > 0
      ? Math.max(
          0,
          numericBaseline - numericReduction
        )
      : 0;

  /* =========================================================
     SUMMARY
  ========================================================= */

  const activeGoals = goals.filter(
    (goal) => goal.status === "ACTIVE"
  );

  const totalReductionTarget = goals.reduce(
    (sum, goal) =>
      sum + Number(goal.targetReduction || 0),
    0
  );

  const averageProgress =
    goals.length > 0
      ? goals.reduce(
          (sum, goal) =>
            sum + Number(goal.progress || 0),
          0
        ) / goals.length
      : 0;

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBaselineCO2("");
    setTargetReduction("");

    setStartDate(
      new Date().toISOString().split("T")[0]
    );

    setTargetDate("");
  };

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  const handleSubmit = async () => {
    try {
      setError("");
      setSuccess("");

      if (!title.trim()) {
        setError("Please enter a goal title.");
        return;
      }

      if (
        !baselineCO2 ||
        !Number.isFinite(numericBaseline) ||
        numericBaseline < 0
      ) {
        setError(
          "Please enter a valid baseline CO₂ value."
        );
        return;
      }

      if (
        !targetReduction ||
        !Number.isFinite(numericReduction) ||
        numericReduction <= 0
      ) {
        setError(
          "Target reduction must be greater than 0."
        );
        return;
      }

      if (!startDate || !targetDate) {
        setError(
          "Please select both start and target dates."
        );
        return;
      }

      if (
        new Date(targetDate) <=
        new Date(startDate)
      ) {
        setError(
          "Target date must be after start date."
        );
        return;
      }

      setSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        baselineCO2: numericBaseline,
        targetReduction: numericReduction,
        startDate,
        targetDate,
      };

      if (editingId) {
        await api.put(
          `/goals/${editingId}`,
          payload
        );

        setSuccess(
          "Goal updated successfully."
        );
      } else {
        await api.post("/goals", payload);

        setSuccess(
          "Goal created successfully."
        );
      }

      resetForm();
      await loadGoals();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to save goal."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (goal: Goal) => {
    setEditingId(goal._id);

    setTitle(goal.title);
    setDescription(goal.description || "");

    setBaselineCO2(
      String(goal.baselineCO2)
    );

    setTargetReduction(
      String(goal.targetReduction)
    );

    setStartDate(
      new Date(goal.startDate)
        .toISOString()
        .split("T")[0]
    );

    setTargetDate(
      new Date(goal.targetDate)
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

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/goals/${id}`);

      setSuccess(
        "Goal deleted successfully."
      );

      await loadGoals();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to delete goal."
      );
    }
  };

  /* =========================================================
     STATUS
  ========================================================= */

  const getStatusColor = (
    status: Goal["status"]
  ) => {
    switch (status) {
      case "COMPLETED":
        return "#16804F";

      case "EXPIRED":
        return "#C65D45";

      default:
        return "#337AB7";
    }
  };

  const getStatusBackground = (
    status: Goal["status"]
  ) => {
    switch (status) {
      case "COMPLETED":
        return "#E8F5EE";

      case "EXPIRED":
        return "#FBEDE9";

      default:
        return "#EEF5FB";
    }
  };

  /* =========================================================
     DAYS REMAINING
  ========================================================= */

  const getDaysRemaining = (
    targetDateValue: string
  ) => {
    const today = new Date();
    const target = new Date(targetDateValue);

    const difference =
      target.getTime() - today.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  /* =========================================================
     FORM PREVIEW
  ========================================================= */

  const formProgressPreview = useMemo(() => {
    if (
      numericBaseline <= 0 ||
      numericReduction <= 0
    ) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        (numericReduction / numericBaseline) *
          100
      )
    );
  }, [
    numericBaseline,
    numericReduction,
  ]);

  /* =========================================================
     RENDER
  ========================================================= */

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
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <Box
          sx={{
            mb: {
              xs: 2.5,
              md: 4,
            },
          }}
        >
          <SafeStack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
          >
            <Box>
              <SafeStack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
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
                  Sustainability goals
                </Typography>
              </SafeStack>

              <Typography
                sx={{
                  fontSize: {
                    xs: 30,
                    sm: 34,
                    md: 40,
                  },
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-1.4px",
                  color: "#17221C",
                }}
              >
                Goals
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
                  maxWidth: 580,
                }}
              >
                Set measurable carbon reduction
                targets, monitor your progress,
                and stay consistent with your
                sustainability journey.
              </Typography>
            </Box>

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
              }}
            >
              <SafeStack
                direction="row"
                spacing={1.2}
                alignItems="center"
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
                  }}
                >
                  <EmojiEventsOutlinedIcon />
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
                    Active goals
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 900,
                      color: "#16804F",
                    }}
                  >
                    {activeGoals.length}
                  </Typography>
                </Box>
              </SafeStack>
            </Box>
          </SafeStack>
        </Box>

        {/* =================================================
            ALERTS
        ================================================= */}

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
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
            onClose={() => setSuccess("")}
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

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

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
          {/* TOTAL GOALS */}

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
                borderRadius: "20px",
                border:
                  "1px solid #E4ECE7",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent>
                <SafeStack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      color: "#16804F",
                      background:
                        "#E8F5EE",
                    }}
                  >
                    <EmojiEventsOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#819088",
                        fontWeight: 700,
                      }}
                    >
                      Total Goals
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#17221C",
                      }}
                    >
                      {goals.length}
                    </Typography>
                  </Box>
                </SafeStack>
              </CardContent>
            </Card>
          </Grid>

          {/* ACTIVE */}

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
                borderRadius: "20px",
                border:
                  "1px solid #E4ECE7",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent>
                <SafeStack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      color: "#337AB7",
                      background:
                        "#EEF5FB",
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
                      Active
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "#17221C",
                      }}
                    >
                      {activeGoals.length}
                    </Typography>
                  </Box>
                </SafeStack>
              </CardContent>
            </Card>
          </Grid>

          {/* REDUCTION TARGET */}

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
                borderRadius: "20px",
                border:
                  "1px solid #E4ECE7",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent>
                <SafeStack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      color: "#C65D45",
                      background:
                        "#FBEDE9",
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
                      Reduction Target
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: "#17221C",
                      }}
                    >
                      {totalReductionTarget.toFixed(
                        1
                      )}{" "}
                      kg
                    </Typography>
                  </Box>
                </SafeStack>
              </CardContent>
            </Card>
          </Grid>

          {/* AVG PROGRESS */}

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
                borderRadius: "20px",
                border:
                  "1px solid #E4ECE7",
                boxShadow:
                  "0 8px 28px rgba(20,80,50,0.055)",
              }}
            >
              <CardContent>
                <SafeStack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      color: "#6B5CC5",
                      background:
                        "#F0EEFA",
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
                      Avg. Progress
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: 21,
                        fontWeight: 900,
                        color: "#17221C",
                      }}
                    >
                      {averageProgress.toFixed(
                        0
                      )}
                      %
                    </Typography>
                  </Box>
                </SafeStack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* =================================================
            CREATE / EDIT GOAL
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mb: {
              xs: 2.5,
              md: 3,
            },
            borderRadius: {
              xs: "20px",
              md: "24px",
            },
            border:
              "1px solid #E2EAE5",
            boxShadow:
              "0 12px 38px rgba(20,80,50,0.065)",
            overflow: "hidden",
          }}
        >
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
            <SafeStack
              direction="row"
              spacing={1.5}
              alignItems="center"
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
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
                  <AddOutlinedIcon />
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
                    color: "#17221C",
                  }}
                >
                  {editingId
                    ? "Edit Sustainability Goal"
                    : "Create New Goal"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 12,
                    color: "#7A8981",
                  }}
                >
                  Set a clear carbon reduction
                  target and track it over time.
                </Typography>
              </Box>
            </SafeStack>
          </Box>

          <CardContent
            sx={{
              p: {
                xs: 2,
                sm: 3,
                md: 3.5,
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
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  label="Goal Title"
                  placeholder="e.g. Reduce monthly emissions"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="Describe what you want to achieve"
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  fullWidth
                  type="number"
                  label="Baseline CO₂ (kg)"
                  value={baselineCO2}
                  onChange={(e) =>
                    setBaselineCO2(
                      e.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      step: "any",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  fullWidth
                  type="number"
                  label="Target Reduction (kg)"
                  value={targetReduction}
                  onChange={(e) =>
                    setTargetReduction(
                      e.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0.01,
                      step: "any",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  md: 3,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="Target Date"
                  value={targetDate}
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor:
                        "#FBFCFB",
                      "&.Mui-focused fieldset": {
                        borderColor:
                          "#16804F",
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused":
                      {
                        color: "#16804F",
                      },
                  }}
                />
              </Grid>
            </Grid>

            {/* =================================================
                PREVIEW
            ================================================= */}

            <Box
              sx={{
                mt: 3,
                p: {
                  xs: 2,
                  sm: 2.5,
                },
                borderRadius: "18px",
                background:
                  "linear-gradient(135deg, #E8F5EE 0%, #F4FAF6 100%)",
                border:
                  "1px solid #D5EBDD",
              }}
            >
              <SafeStack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                alignItems={{
                  xs: "stretch",
                  sm: "center",
                }}
                justifyContent="space-between"
              >
                <SafeStack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "15px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      color: "#16804F",
                      background:
                        "#FFFFFF",
                    }}
                  >
                    <TrendingDownOutlinedIcon />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#6C7C73",
                        textTransform:
                          "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      Goal Preview
                    </Typography>

                    <Typography
                      sx={{
                        mt: 0.3,
                        fontSize: 13,
                        color: "#819088",
                      }}
                    >
                      Reduce your baseline
                      emissions toward the
                      selected target.
                    </Typography>
                  </Box>
                </SafeStack>

                <Box
                  sx={{
                    minWidth: {
                      xs: "100%",
                      sm: 210,
                    },
                    px: 2,
                    py: 1.4,
                    borderRadius: "14px",
                    backgroundColor:
                      "#FFFFFF",
                    border:
                      "1px solid #D9EDE1",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#7A8981",
                      textTransform:
                        "uppercase",
                    }}
                  >
                    Target CO₂
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 23,
                      fontWeight: 900,
                      color: "#16804F",
                    }}
                  >
                    {previewTargetCO2.toFixed(
                      2
                    )}{" "}
                    kg
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={formProgressPreview}
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 10,
                      backgroundColor:
                        "#E5EFE9",
                      "& .MuiLinearProgress-bar":
                        {
                          borderRadius: 10,
                          backgroundColor:
                            "#16804F",
                        },
                    }}
                  />
                </Box>
              </SafeStack>
            </Box>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <Box
              sx={{
                mt: 3,
                pt: 2.5,
                borderTop:
                  "1px solid #EDF2EE",
              }}
            >
              <SafeStack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                spacing={1.5}
                justifyContent="flex-end"
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
                      borderRadius: "13px",
                      textTransform:
                        "none",
                      fontWeight: 800,
                      borderColor:
                        "#D7E2DC",
                      color: "#5F7067",
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
                  startIcon={
                    editingId ? (
                      <EditOutlinedIcon />
                    ) : (
                      <AddOutlinedIcon />
                    )
                  }
                  sx={{
                    minWidth: {
                      sm: 180,
                    },
                    height: 48,
                    borderRadius: "13px",
                    textTransform:
                      "none",
                    fontWeight: 900,
                    background:
                      "linear-gradient(135deg, #16804F 0%, #0F6B40 100%)",
                    boxShadow:
                      "0 10px 24px rgba(22,128,79,0.20)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #126C43 0%, #0B5A35 100%)",
                    },
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Goal"
                    : "Create Goal"}
                </Button>
              </SafeStack>
            </Box>
          </CardContent>
        </Card>

        {/* =================================================
            GOALS LIST
        ================================================= */}

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
            <SafeStack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 18,
                      sm: 20,
                    },
                    fontWeight: 900,
                    color: "#17221C",
                  }}
                >
                  Your Sustainability Goals
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: 12,
                    color: "#819088",
                  }}
                >
                  Monitor your carbon reduction
                  journey in one place.
                </Typography>
              </Box>

              <Chip
                label={`${goals.length} ${
                  goals.length === 1
                    ? "goal"
                    : "goals"
                }`}
                size="small"
                sx={{
                  backgroundColor:
                    "#F1F6F3",
                  color: "#5F7067",
                  fontWeight: 800,
                  borderRadius: "9px",
                }}
              />
            </SafeStack>
          </Box>

          <Divider
            sx={{
              borderColor: "#EDF2EE",
            }}
          />

          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection:
                  "column",
                alignItems: "center",
                py: 8,
              }}
            >
              <CircularProgress
                size={32}
                sx={{
                  color: "#16804F",
                }}
              />

              <Typography
                sx={{
                  mt: 2,
                  fontSize: 13,
                  color: "#819088",
                  fontWeight: 600,
                }}
              >
                Loading your goals...
              </Typography>
            </Box>
          ) : goals.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: {
                  xs: 6,
                  sm: 8,
                },
                px: 2,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  mx: "auto",
                  borderRadius: "22px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  color: "#16804F",
                  background:
                    "#E8F5EE",
                }}
              >
                <EmojiEventsOutlinedIcon
                  sx={{
                    fontSize: 36,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  mt: 2,
                  fontSize: 17,
                  fontWeight: 900,
                  color: "#17221C",
                }}
              >
                No goals yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#819088",
                  maxWidth: 430,
                  mx: "auto",
                }}
              >
                Create your first sustainability
                goal above and start tracking
                your progress.
              </Typography>
            </Box>
          ) : (
            <SafeStack>
              {goals.map(
                (goal, index) => {
                  const statusColor =
                    getStatusColor(
                      goal.status
                    );

                  const statusBackground =
                    getStatusBackground(
                      goal.status
                    );

                  const daysRemaining =
                    getDaysRemaining(
                      goal.targetDate
                    );

                  const progress = Math.min(
                    100,
                    Math.max(
                      0,
                      Number(
                        goal.progress || 0
                      )
                    )
                  );

                  return (
                    <Box
                      key={goal._id}
                      sx={{
                        px: {
                          xs: 1.5,
                          sm: 2.5,
                          md: 3.5,
                        },
                        py: {
                          xs: 2,
                          sm: 2.5,
                        },
                        transition:
                          "all 0.2s ease",
                        "&:hover": {
                          backgroundColor:
                            "#FAFCFA",
                        },
                      }}
                    >
                      <SafeStack
                        direction={{
                          xs: "column",
                          md: "row",
                        }}
                        spacing={2}
                        justifyContent="space-between"
                      >
                        {/* LEFT */}

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <SafeStack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                minWidth: 48,
                                borderRadius:
                                  "14px",
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
                              <TrackChangesOutlinedIcon />
                            </Box>

                            <Box
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <SafeStack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                              >
                                <Typography
                                  sx={{
                                    fontSize: {
                                      xs: 15,
                                      sm: 17,
                                    },
                                    fontWeight:
                                      900,
                                    color:
                                      "#17221C",
                                  }}
                                >
                                  {goal.title}
                                </Typography>

                                <Chip
                                  label={
                                    goal.status
                                  }
                                  size="small"
                                  sx={{
                                    height: 23,
                                    borderRadius:
                                      "7px",
                                    fontSize:
                                      9,
                                    fontWeight:
                                      900,
                                    color:
                                      statusColor,
                                    backgroundColor:
                                      statusBackground,
                                  }}
                                />
                              </SafeStack>

                              {goal.description && (
                                <Typography
                                  sx={{
                                    mt: 0.5,
                                    fontSize:
                                      12,
                                    color:
                                      "#819088",
                                    lineHeight:
                                      1.5,
                                  }}
                                >
                                  {
                                    goal.description
                                  }
                                </Typography>
                              )}

                              <SafeStack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                sx={{
                                  mt: 1,
                                }}
                              >
                                <SafeStack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                >
                                  <Co2OutlinedIcon
                                    sx={{
                                      fontSize:
                                        14,
                                      color:
                                        "#8A9890",
                                    }}
                                  />

                                  <Typography
                                    sx={{
                                      fontSize:
                                        11,
                                      color:
                                        "#819088",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Baseline{" "}
                                    {Number(
                                      goal.baselineCO2 ||
                                        0
                                    ).toFixed(
                                      2
                                    )}{" "}
                                    kg
                                  </Typography>
                                </SafeStack>

                                <Typography
                                  sx={{
                                    color:
                                      "#C1CAC5",
                                  }}
                                >
                                  •
                                </Typography>

                                <SafeStack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                >
                                  <TrendingDownOutlinedIcon
                                    sx={{
                                      fontSize:
                                        14,
                                      color:
                                        "#16804F",
                                    }}
                                  />

                                  <Typography
                                    sx={{
                                      fontSize:
                                        11,
                                      color:
                                        "#819088",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Reduce{" "}
                                    {Number(
                                      goal.targetReduction ||
                                        0
                                    ).toFixed(
                                      2
                                    )}{" "}
                                    kg
                                  </Typography>
                                </SafeStack>

                                <Typography
                                  sx={{
                                    color:
                                      "#C1CAC5",
                                  }}
                                >
                                  •
                                </Typography>

                                <SafeStack
                                  direction="row"
                                  spacing={0.5}
                                  alignItems="center"
                                >
                                  <CalendarTodayOutlinedIcon
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
                                        11,
                                      color:
                                        "#819088",
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {new Date(
                                      goal.targetDate
                                    ).toLocaleDateString()}
                                  </Typography>
                                </SafeStack>
                              </SafeStack>
                            </Box>
                          </SafeStack>
                        </Box>

                        {/* RIGHT */}

                        <Box
                          sx={{
                            width: {
                              xs: "100%",
                              md: 330,
                            },
                          }}
                        >
                          <SafeStack
                            direction="row"
                            spacing={1}
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Typography
                                sx={{
                                  fontSize: 10,
                                  color:
                                    "#7A8981",
                                  fontWeight:
                                    800,
                                  textTransform:
                                    "uppercase",
                                  letterSpacing:
                                    0.6,
                                }}
                              >
                                Progress
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.2,
                                  fontSize: 22,
                                  fontWeight:
                                    900,
                                  color:
                                    "#16804F",
                                }}
                              >
                                {progress.toFixed(
                                  0
                                )}
                                %
                              </Typography>
                            </Box>

                            <SafeStack
                              direction="row"
                              spacing={0.8}
                            >
                              <IconButton
                                onClick={() =>
                                  handleEdit(
                                    goal
                                  )
                                }
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
                                  "&:hover":
                                    {
                                      color:
                                        "#16804F",
                                      backgroundColor:
                                        "#E8F5EE",
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

                              <IconButton
                                onClick={() =>
                                  handleDelete(
                                    goal._id
                                  )
                                }
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
                                  "&:hover":
                                    {
                                      color:
                                        "#C44942",
                                      backgroundColor:
                                        "#FFF3F1",
                                    },
                                }}
                              >
                                <DeleteOutlineOutlinedIcon
                                  sx={{
                                    fontSize:
                                      19,
                                  }}
                                />
                              </IconButton>
                            </SafeStack>
                          </SafeStack>

                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              mt: 1,
                              height: 8,
                              borderRadius: 10,
                              backgroundColor:
                                "#E7EFEA",
                              "& .MuiLinearProgress-bar":
                                {
                                  borderRadius:
                                    10,
                                  background:
                                    "linear-gradient(90deg, #16804F 0%, #37A66F 100%)",
                                },
                            }}
                          />

                          <SafeStack
                            direction="row"
                            justifyContent="space-between"
                            sx={{
                              mt: 0.8,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  10.5,
                                color:
                                  "#819088",
                                fontWeight:
                                  600,
                              }}
                            >
                              Current{" "}
                              {Number(
                                goal.currentCO2 ||
                                  0
                              ).toFixed(
                                2
                              )}{" "}
                              kg
                            </Typography>

                            <SafeStack
                              direction="row"
                              spacing={0.4}
                              alignItems="center"
                            >
                              <AccessTimeRoundedIcon
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
                                    10.5,
                                  color:
                                    "#819088",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {goal.status ===
                                "COMPLETED"
                                  ? "Completed"
                                  : goal.status ===
                                    "EXPIRED"
                                  ? "Expired"
                                  : daysRemaining >=
                                    0
                                  ? `${daysRemaining} days left`
                                  : "Due"}
                              </Typography>
                            </SafeStack>
                          </SafeStack>
                        </Box>
                      </SafeStack>

                      {index <
                        goals.length - 1 && (
                        <Divider
                          sx={{
                            mt: {
                              xs: 2,
                              sm: 2.5,
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
            </SafeStack>
          )}
        </Card>

        {/* =================================================
            FOOTER
        ================================================= */}

        {goals.length > 0 && (
          <Box
            sx={{
              mt: 2,
              px: {
                xs: 1,
                sm: 0,
              },
            }}
          >
            <SafeStack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <CheckCircleOutlineRoundedIcon
                sx={{
                  fontSize: 15,
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
                Goals are automatically updated
                using your logged activity and
                carbon emissions.
              </Typography>
            </SafeStack>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Goals;