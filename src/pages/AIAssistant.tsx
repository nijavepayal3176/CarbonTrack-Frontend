import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import type {
  KeyboardEvent,
  ReactNode,
} from "react";

import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import EnergySavingsLeafRoundedIcon from "@mui/icons-material/EnergySavingsLeafRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";

/* NEW: composer icons only */
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";

import api from "../services/api";

/* =========================================================
   TYPES
========================================================= */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIResponse {
  success: boolean;

  data?: {
    answer: string;

    context?: {
      totalActivities: number;
      totalCO2: number;
      averageCO2PerActivity: number;
      topCategory: string | null;
    };
  };

  message?: string;
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

const quickActions = [
  {
    label: "Analyze my footprint",
    question:
      "Analyze my carbon footprint and tell me what I should improve first.",
    icon: <InsightsRoundedIcon />,
  },
  {
    label: "Find biggest emission",
    question:
      "Which category is causing the most emissions in my activities?",
    icon: <EnergySavingsLeafRoundedIcon />,
  },
  {
    label: "Reduce transport",
    question:
      "How can I reduce my transportation carbon emissions?",
    icon: <DirectionsCarRoundedIcon />,
  },
  {
    label: "Give me eco tips",
    question:
      "Give me 5 practical sustainability tips based on my activity data.",
    icon: <TipsAndUpdatesRoundedIcon />,
  },
  {
    label: "Help me reach my goal",
    question:
      "What should I do to improve my carbon reduction progress and reach my goals?",
    icon: <EmojiEventsRoundedIcon />,
  },
];

/* =========================================================
   MESSAGE ID
========================================================= */

const createMessageId = () =>
  `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;

/* =========================================================
   CLEAN AI TEXT
========================================================= */

const cleanAIText = (
  text: string
): string => {
  if (!text) {
    return "";
  }

  let cleaned = text;

  cleaned = cleaned.replace(
    /<br\s*\/?>/gi,
    "\n"
  );

  cleaned = cleaned.replace(
    /<\/?p>/gi,
    ""
  );

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const hasTable = lines.some(
    (line) =>
      line.startsWith("|") &&
      line.endsWith("|")
  );

  if (hasTable) {
    const filtered = lines.filter(
      (line) => {
        const isSeparator =
          /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(
            line
          );

        return !isSeparator;
      }
    );

    cleaned = filtered
      .map((line) => {
        if (
          line.startsWith("|") &&
          line.endsWith("|")
        ) {
          const cells = line
            .slice(1, -1)
            .split("|")
            .map((cell) =>
              cell.trim()
            )
            .filter(Boolean);

          return cells
            .map(
              (cell, index) =>
                `${index + 1}. ${cell}`
            )
            .join(" • ");
        }

        return line;
      })
      .join("\n");
  }

  cleaned = cleaned.replace(
    /\n{3,}/g,
    "\n\n"
  );

  return cleaned.trim();
};

/* =========================================================
   INLINE MARKDOWN
========================================================= */

const renderInline = (
  text: string
): ReactNode[] => {
  const parts = text.split(
    /(\*\*.*?\*\*|`.*?`)/g
  );

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <Box
          key={index}
          component="span"
          sx={{
            fontWeight: 800,
            color: "#193D2A",
          }}
        >
          {part.slice(2, -2)}
        </Box>
      );
    }

    if (
      part.startsWith("`") &&
      part.endsWith("`")
    ) {
      return (
        <Box
          key={index}
          component="span"
          sx={{
            px: 0.6,
            py: 0.15,
            borderRadius: 0.8,
            background: "#EDF4EF",
            color: "#28704A",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.88em",
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }

    return (
      <Box
        key={index}
        component="span"
      >
        {part}
      </Box>
    );
  });
};

/* =========================================================
   AI ANSWER RENDERER
========================================================= */

const renderAIAnswer = (
  content: string
): ReactNode => {
  const cleaned = cleanAIText(content);

  const lines = cleaned.split("\n");

  const elements: ReactNode[] = [];

  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (!bulletBuffer.length) {
      return;
    }

    elements.push(
      <Box
        key={`bullets-${elements.length}`}
        sx={{
          mt: 0.8,
          mb: 0.8,
        }}
      >
        <Stack spacing={0.75}>
          {bulletBuffer.map(
            (bullet, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  gap: 0.9,
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    fontSize: 16,
                    color: "#42A96F",
                    mt: "3px",
                    flexShrink: 0,
                  }}
                />

                <Typography
                  component="span"
                  sx={{
                    fontSize: "inherit",
                    lineHeight: 1.75,
                    color: "inherit",
                  }}
                >
                  {renderInline(
                    bullet
                  )}
                </Typography>
              </Box>
            )
          )}
        </Stack>
      </Box>
    );

    bulletBuffer = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushBullets();

      elements.push(
        <Box
          key={`space-${index}`}
          sx={{ height: 5 }}
        />
      );

      return;
    }

    if (
      line.startsWith("### ") ||
      line.startsWith("## ") ||
      line.startsWith("# ")
    ) {
      flushBullets();

      const heading = line
        .replace(/^#{1,3}\s*/, "")
        .trim();

      elements.push(
        <Typography
          key={`heading-${index}`}
          sx={{
            mt:
              elements.length > 0
                ? 1.2
                : 0,
            mb: 0.65,
            fontSize: {
              xs: "0.92rem",
              sm: "0.98rem",
            },
            fontWeight: 850,
            color: "#193D2A",
            letterSpacing:
              "-0.2px",
          }}
        >
          {heading}
        </Typography>
      );

      return;
    }

    const numberedMatch =
      line.match(
        /^(\d+)[.)]\s+(.*)$/
      );

    if (numberedMatch) {
      flushBullets();

      elements.push(
        <Box
          key={`number-${index}`}
          sx={{
            display: "flex",
            gap: 1,
            alignItems:
              "flex-start",
            mb: 0.55,
          }}
        >
          <Box
            sx={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#EAF7EF",
              color: "#168A52",
              fontSize: "0.68rem",
              fontWeight: 850,
              mt: "2px",
            }}
          >
            {numberedMatch[1]}
          </Box>

          <Typography
            sx={{
              fontSize: "inherit",
              lineHeight: 1.75,
            }}
          >
            {renderInline(
              numberedMatch[2]
            )}
          </Typography>
        </Box>
      );

      return;
    }

    if (
      line.startsWith("- ") ||
      line.startsWith("* ") ||
      line.startsWith("• ")
    ) {
      bulletBuffer.push(
        line.replace(
          /^[-*•]\s*/,
          ""
        )
      );

      return;
    }

    flushBullets();

    const lower =
      line.toLowerCase();

    const isImportant =
      lower.includes("important") ||
      lower.includes("priority") ||
      lower.includes("best option") ||
      lower.includes("start with") ||
      lower.includes("most important");

    if (isImportant) {
      elements.push(
        <Box
          key={`important-${index}`}
          sx={{
            my: 0.9,
            px: 1.35,
            py: 1.05,
            borderRadius: 2,
            background:
              "linear-gradient(135deg,#F0FAF4,#F8FCF9)",
            border:
              "1px solid #DCEDE3",
            display: "flex",
            alignItems:
              "flex-start",
            gap: 0.9,
          }}
        >
          <LightbulbRoundedIcon
            sx={{
              fontSize: 18,
              color: "#D49627",
              mt: "2px",
              flexShrink: 0,
            }}
          />

          <Typography
            sx={{
              fontSize: "inherit",
              lineHeight: 1.7,
            }}
          >
            {renderInline(line)}
          </Typography>
        </Box>
      );

      return;
    }

    elements.push(
      <Typography
        key={`text-${index}`}
        sx={{
          fontSize: "inherit",
          lineHeight: 1.78,
          color: "inherit",
        }}
      >
        {renderInline(line)}
      </Typography>
    );
  });

  flushBullets();

  return (
    <Box sx={{ width: "100%" }}>
      {elements}
    </Box>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const AIAssistant = () => {
  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [attachedFile, setAttachedFile] =
    useState<File | null>(null);

  const [isListening, setIsListening] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [searchParams] =
    useSearchParams();

  const hasProcessedURLQuestion =
    useRef(false);

  /* =======================================================
     ASK AI
  ======================================================= */

  const askAI = async (
    customQuestion?: string
  ) => {
    const finalQuestion = (
      customQuestion ?? question
    ).trim();

    if (
      !finalQuestion ||
      loading
    ) {
      return;
    }

    setError("");

    const userMessage: Message = {
      id: createMessageId(),
      role: "user",
      content: finalQuestion,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");

    setLoading(true);

    try {
      const response =
        await api.post<AIResponse>(
          "/ai/ask",
          {
            question:
              finalQuestion,
          }
        );

      const answer =
        response.data?.data?.answer;

      if (!answer) {
        throw new Error(
          response.data?.message ||
            "AI response was empty."
        );
      }

      const assistantMessage: Message = {
        id: createMessageId(),
        role: "assistant",
        content: answer,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (err: unknown) {
      console.error(
        "AI Assistant error:",
        err
      );

      const errorObject =
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
          message?: string;
        };

      const message =
        errorObject?.response?.data
          ?.message ||
        errorObject?.message ||
        "Unable to connect to CarbonTrack AI.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     RECEIVE SEARCH FROM TOPBAR
  ======================================================= */

  useEffect(() => {
    const urlQuestion =
      searchParams.get("question");

    if (
      urlQuestion &&
      urlQuestion.trim() &&
      !hasProcessedURLQuestion.current
    ) {
      hasProcessedURLQuestion.current =
        true;

      const decodedQuestion =
        urlQuestion.trim();

      setQuestion(decodedQuestion);

      void askAI(decodedQuestion);
    }
  }, [searchParams]);

  /* =======================================================
     ENTER HANDLER
  ======================================================= */

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      void askAI();
    }
  };

  /* =======================================================
     FILE HANDLER
  ======================================================= */

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setAttachedFile(file);

    if (!question.trim()) {
      setQuestion(
        `Please analyze this file: ${file.name}`
      );
    }
  };

  /* =======================================================
     MICROPHONE
  ======================================================= */

  const handleMic = () => {
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            continuous: boolean;
            start: () => void;
            stop: () => void;
            onresult:
              | ((event: {
                  results: {
                    [index: number]: {
                      [index: number]: {
                        transcript: string;
                      };
                    };
                  };
                }) => void)
              | null;
            onend:
              | (() => void)
              | null;
            onerror:
              | (() => void)
              | null;
          };
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            continuous: boolean;
            start: () => void;
            stop: () => void;
            onresult:
              | ((event: {
                  results: {
                    [index: number]: {
                      [index: number]: {
                        transcript: string;
                      };
                    };
                  };
                }) => void)
              | null;
            onend:
              | (() => void)
              | null;
            onerror:
              | (() => void)
              | null;
          };
        }
      ).SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition?: new () => {
            lang: string;
            interimResults: boolean;
            continuous: boolean;
            start: () => void;
            stop: () => void;
            onresult:
              | ((event: {
                  results: {
                    [index: number]: {
                      [index: number]: {
                        transcript: string;
                      };
                    };
                  };
                }) => void)
              | null;
            onend:
              | (() => void)
              | null;
            onerror:
              | (() => void)
              | null;
          };
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser."
      );

      return;
    }

    try {
      const recognition =
        new SpeechRecognition();

      recognition.lang =
        "en-IN";

      recognition.interimResults =
        true;

      recognition.continuous = false;

      setIsListening(true);

      recognition.onresult =
        (event) => {
          let transcript = "";

          Object.keys(
            event.results
          ).forEach((key) => {
            const index =
              Number(key);

            transcript +=
              event.results[index][0]
                ?.transcript || "";
          });

          setQuestion(
            (previous) =>
              `${previous}${previous ? " " : ""}${transcript}`.trim()
          );
        };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);

        setError(
          "Unable to capture voice. Please try again."
        );
      };

      recognition.start();
    } catch (error) {
      console.error(
        "Speech recognition error:",
        error
      );

      setIsListening(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",

        background:
          "linear-gradient(180deg,#F7FBF8 0%,#FFFFFF 48%,#F8FBF9 100%)",

        px: {
          xs: 1.2,
          sm: 2,
          md: 3,
        },

        py: {
          xs: 1.2,
          sm: 1.8,
          md: 2.2,
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1380,
          height: "100%",
          minHeight: 0,
          mx: "auto",

          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* =================================================
            TOP BRAND
        ================================================= */}

        <Box
          sx={{
            flexShrink: 0,
            pb: {
              xs: 1.2,
              sm: 1.5,
            },
          }}
        >
<Stack
  direction="row"
  spacing={1.2}
  sx={{
    alignItems: "center",
  }}
>            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg,#E9F8EF,#DDF2E5)",

                color: "#168A52",

                border:
                  "1px solid #DCEDE3",
              }}
            >
              <AutoAwesomeRoundedIcon
                sx={{ fontSize: 20 }}
              />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.02rem",
                    sm: "1.12rem",
                  },

                  fontWeight: 850,
                  color: "#193D2A",
                  letterSpacing:
                    "-0.35px",
                }}
              >
                AI Assistant
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.65rem",
                    sm: "0.7rem",
                  },

                  color: "#87968E",
                  mt: 0.1,
                }}
              >
                Personalized sustainability insights
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* =================================================
            CHAT CARD
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            width: "100%",

            display: "flex",
            flexDirection: "column",

            overflow: "hidden",

            borderRadius: {
              xs: 3,
              sm: 3.5,
              md: 4,
            },

            background: "#FFFFFF",

            border:
              "1px solid #E1EAE4",

            boxShadow:
              "0 15px 50px rgba(31,75,50,0.075)",
          }}
        >
          {/* =================================================
              CHAT HEADER
          ================================================= */}

          <Box
            sx={{
              flexShrink: 0,

              px: {
                xs: 1.5,
                sm: 2.2,
                md: 2.8,
              },

              py: {
                xs: 1.25,
                sm: 1.4,
              },

              borderBottom:
                "1px solid #E9EFEB",

              background:
                "rgba(255,255,255,0.98)",

              zIndex: 5,
            }}
          >
<Stack
  direction="row"
  spacing={1.25}
  sx={{
    alignItems: "center",
  }}
>              <Box
                sx={{
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,

                    background:
                      "linear-gradient(135deg,#35A86B,#168A52)",

                    color: "#FFFFFF",

                    boxShadow:
                      "0 6px 18px rgba(22,138,82,0.18)",
                  }}
                >
                  <SmartToyRoundedIcon
                    sx={{ fontSize: 22 }}
                  />
                </Avatar>

                <Box
                  sx={{
                    position: "absolute",
                    width: 10,
                    height: 10,
                    right: -1,
                    bottom: 0,
                    borderRadius: "50%",

                    background:
                      loading
                        ? "#E2A42C"
                        : "#45C47B",

                    border:
                      "2px solid #FFFFFF",
                  }}
                />
              </Box>

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
    alignItems: "center",
  }}
>                  <Typography
                    sx={{
                      fontSize: {
                        xs: "0.9rem",
                        sm: "0.96rem",
                      },

                      fontWeight: 800,
                      color: "#193D2A",
                    }}
                  >
                    CarbonTrack AI
                  </Typography>

                  <Chip
                    label={
                      loading
                        ? "Thinking"
                        : "Online"
                    }
                    size="small"
                    sx={{
                      height: 21,
                      fontSize:
                        "0.61rem",
                      fontWeight: 750,

                      color: loading
                        ? "#98670F"
                        : "#168A52",

                      background:
                        loading
                          ? "#FFF7E7"
                          : "#EEF9F2",

                      border:
                        loading
                          ? "1px solid #F2E2B9"
                          : "1px solid #D9EEDF",

                      "& .MuiChip-label":
                        {
                          px: 0.85,
                        },
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: "#83938B",
                    fontSize:
                      "0.68rem",
                    lineHeight: 1.4,
                  }}
                >
                  Your personal sustainability companion
                </Typography>
              </Box>

              <Box
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                }}
              >
                <Chip
                  icon={
                    <BoltRoundedIcon
                      sx={{
                        fontSize:
                          "14px !important",
                      }}
                    />
                  }
                  label="Personalized"
                  size="small"
                  sx={{
                    height: 27,
                    color: "#377356",
                    background:
                      "#F1F8F4",

                    border:
                      "1px solid #DFECE3",

                    fontSize:
                      "0.65rem",

                    fontWeight: 700,

                    "& .MuiChip-icon": {
                      color: "#48A874",
                    },
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* =================================================
              MESSAGES SCROLL AREA
          ================================================= */}

          <Box
            sx={{
              flex: 1,
              minHeight: 0,

              overflowY: "auto",
              overflowX: "hidden",

              px: {
                xs: 1.5,
                sm: 2.5,
                md: 4,
              },

              py: {
                xs: 1.8,
                sm: 2.4,
                md: 3,
              },

              pb: {
                xs: 3,
                sm: 3.5,
                md: 4,
              },

              background:
                "linear-gradient(180deg,#FFFFFF 0%,#FCFEFD 100%)",

              scrollbarWidth: "thin",

              scrollbarColor:
                "#C9DCD1 transparent",

              "&::-webkit-scrollbar": {
                width: 6,
              },

              "&::-webkit-scrollbar-track":
                {
                  background:
                    "transparent",
                },

              "&::-webkit-scrollbar-thumb":
                {
                  background:
                    "#C9DCD1",

                  borderRadius: 20,
                },
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  minHeight: "100%",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  px: 2,
                }}
              >
<Stack
  sx={{
    maxWidth: 650,
    alignItems: "center",
    textAlign: "center",
  }}
>                  <Box
                    sx={{
                      position:
                        "relative",
                      mb: 2.4,
                    }}
                  >
                    <Box
                      sx={{
                        width: {
                          xs: 74,
                          sm: 86,
                        },

                        height: {
                          xs: 74,
                          sm: 86,
                        },

                        borderRadius:
                          "27px",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        background:
                          "linear-gradient(145deg,#EAF8EF,#DDF3E5)",

                        color:
                          "#168A52",

                        border:
                          "1px solid #DCEDE3",

                        boxShadow:
                          "0 16px 35px rgba(22,138,82,0.10)",
                      }}
                    >
                      <AutoAwesomeRoundedIcon
                        sx={{
                          fontSize: {
                            xs: 35,
                            sm: 41,
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        position:
                          "absolute",

                        width: 11,
                        height: 11,

                        right: -3,
                        top: 8,

                        borderRadius:
                          "50%",

                        background:
                          "#86DCAA",

                        border:
                          "3px solid #FFFFFF",
                      }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      fontSize: {
                        xs: "1.18rem",
                        sm: "1.35rem",
                      },

                      fontWeight: 850,

                      color: "#193D2A",

                      letterSpacing:
                        "-0.45px",
                    }}
                  >
                    How can I help you?
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.9,

                      maxWidth: 570,

                      color: "#7B8C83",

                      fontSize: {
                        xs: "0.78rem",
                        sm: "0.84rem",
                      },

                      lineHeight: 1.75,
                    }}
                  >
                    Ask me anything about your
                    carbon footprint,
                    sustainability,
                    transportation,
                    energy, food, or
                    reduction goals.
                  </Typography>



<Stack
  direction="row"
  spacing={0.8}
  useFlexGap
  sx={{
    mt: 2.2,
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>

                    {[
                      "🌱 Footprint",
                      "🚗 Transport",
                      "⚡ Energy",
                      "💡 Eco Tips",
                    ].map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        size="small"
                        sx={{
                          height: 28,

                          background:
                            "#F5F9F6",

                          border:
                            "1px solid #E1EAE4",

                          color:
                            "#64776C",

                          fontSize:
                            "0.66rem",

                          fontWeight: 650,
                        }}
                      />
                    ))}
                  </Stack>



<Stack
  direction="row"
  spacing={1}
  useFlexGap
  sx={{
    mt: 2.2,
    maxWidth: 620,
    flexWrap: "wrap",
    justifyContent: "center",
  }}
>


                    {quickActions
                      .slice(0, 3)
                      .map(
                        (action) => (
                          <Chip
                            key={
                              action.label
                            }
                            icon={
                              action.icon
                            }
                            label={
                              action.label
                            }
                            clickable
                            disabled={
                              loading
                            }
                            onClick={() =>
                              void askAI(
                                action.question
                              )
                            }
                            sx={{
                              height: 34,

                              background:
                                "#FFFFFF",

                              border:
                                "1px solid #DDE8E1",

                              color:
                                "#486456",

                              fontSize:
                                "0.68rem",

                              fontWeight:
                                700,

                              transition:
                                "all 180ms ease",

                              "&:hover":
                                {
                                  background:
                                    "#F1F9F4",

                                  borderColor:
                                    "#C7E1D1",

                                  color:
                                    "#168A52",
                                },

                              "& .MuiChip-icon":
                                {
                                  color:
                                    "#48A874",
                                },
                            }}
                          />
                        )
                      )}
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Stack
                spacing={{
                  xs: 2.2,
                  sm: 2.7,
                }}
              >
                {messages.map(
                  (message) => {
                    const isUser =
                      message.role ===
                      "user";

                    return (
                      <Box
                        key={
                          message.id
                        }
                        sx={{
                          display:
                            "flex",

                          justifyContent:
                            isUser
                              ? "flex-end"
                              : "flex-start",

                          width: "100%",

                          animation:
                            "messageIn 220ms ease-out",

                          "@keyframes messageIn":
                            {
                              from: {
                                opacity: 0,
                                transform:
                                  "translateY(5px)",
                              },

                              to: {
                                opacity: 1,
                                transform:
                                  "translateY(0)",
                              },
                            },
                        }}
                      >
                        <Box
                          sx={{
                            display:
                              "flex",

                            flexDirection:
                              isUser
                                ? "row-reverse"
                                : "row",

                            alignItems:
                              "flex-start",

                            gap: 1,

                            width: "100%",

                            maxWidth:
                              isUser
                                ? {
                                    xs: "92%",
                                    sm: "80%",
                                    md: "72%",
                                  }
                                : {
                                    xs: "96%",
                                    sm: "92%",
                                    md: "86%",
                                  },
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,

                              flexShrink: 0,

                              background:
                                isUser
                                  ? "#F0F4F1"
                                  : "#EAF7EF",

                              color:
                                isUser
                                  ? "#64756C"
                                  : "#168A52",

                              border:
                                "1px solid #DFE9E3",
                            }}
                          >
                            {isUser ? (
                              <PersonRoundedIcon
                                sx={{
                                  fontSize:
                                    17,
                                }}
                              />
                            ) : (
                              <SmartToyRoundedIcon
                                sx={{
                                  fontSize:
                                    18,
                                }}
                              />
                            )}
                          </Avatar>

                          <Box
                            sx={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize:
                                  "0.65rem",

                                fontWeight:
                                  750,

                                color:
                                  "#94A099",

                                mb: 0.5,

                                textAlign:
                                  isUser
                                    ? "right"
                                    : "left",
                              }}
                            >
                              {isUser
                                ? "You"
                                : "CarbonTrack AI"}
                            </Typography>

                            <Paper
                              elevation={0}
                              sx={{
                                px: {
                                  xs: 1.5,
                                  sm: 1.9,
                                },

                                py: {
                                  xs: 1.3,
                                  sm: 1.55,
                                },

                                borderRadius:
                                  isUser
                                    ? "18px 18px 5px 18px"
                                    : "5px 18px 18px 18px",

                                background:
                                  isUser
                                    ? "linear-gradient(135deg,#39A96D,#168A52)"
                                    : "#F8FBF9",

                                color:
                                  isUser
                                    ? "#FFFFFF"
                                    : "#31483C",

                                border:
                                  isUser
                                    ? "none"
                                    : "1px solid #E1EAE4",

                                boxShadow:
                                  isUser
                                    ? "0 7px 18px rgba(22,138,82,0.14)"
                                    : "0 4px 16px rgba(30,75,49,0.035)",

                                fontSize: {
                                  xs: "0.82rem",
                                  sm: "0.87rem",
                                },

                                lineHeight:
                                  1.78,

                                overflowWrap:
                                  "anywhere",

                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {isUser
                                ? message.content
                                : renderAIAnswer(
                                    message.content
                                  )}
                            </Paper>
                          </Box>
                        </Box>
                      </Box>
                    );
                  }
                )}

                {/* =================================================
                    AI THINKING
                ================================================= */}

                {loading && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems:
                        "flex-start",
                      gap: 1,
                      maxWidth: "86%",
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,

                        background:
                          "#EAF7EF",

                        color:
                          "#168A52",

                        border:
                          "1px solid #DFE9E3",
                      }}
                    >
                      <SmartToyRoundedIcon
                        sx={{
                          fontSize: 18,
                        }}
                      />
                    </Avatar>

                    <Paper
                      elevation={0}
                      sx={{
                        px: 1.7,
                        py: 1.25,

                        borderRadius:
                          "5px 18px 18px 18px",

                        background:
                          "#F8FBF9",

                        border:
                          "1px solid #E1EAE4",
                      }}
                    >
<Stack
  direction="row"
  spacing={1}
  sx={{
    alignItems: "center",
  }}
>                        <Box
                          sx={{
                            display:
                              "flex",
                            gap: "3px",
                          }}
                        >
                          {[0, 1, 2].map(
                            (dot) => (
                              <Box
                                key={
                                  dot
                                }
                                sx={{
                                  width: 5,
                                  height: 5,

                                  borderRadius:
                                    "50%",

                                  background:
                                    "#55B982",

                                  animation:
                                    "thinkingDot 1.2s infinite",

                                  animationDelay:
                                    `${dot * 0.18}s`,

                                  "@keyframes thinkingDot":
                                    {
                                      "0%, 60%, 100%":
                                        {
                                          opacity:
                                            0.3,

                                          transform:
                                            "translateY(0)",
                                        },

                                      "30%": {
                                        opacity:
                                          1,

                                        transform:
                                          "translateY(-3px)",
                                      },
                                    },
                                }}
                              />
                            )
                          )}
                        </Box>

                        <Typography
                          sx={{
                            fontSize:
                              "0.74rem",

                            color:
                              "#819189",
                          }}
                        >
                          CarbonTrack AI is thinking…
                        </Typography>
                      </Stack>
                    </Paper>
                  </Box>
                )}
              </Stack>
            )}
          </Box>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <Alert
              severity="error"
              sx={{
                mx: {
                  xs: 1,
                  sm: 2,
                  md: 4,
                },

                mt: 1,

                borderRadius: 2,

                py: 0.2,

                fontSize:
                  "0.72rem",

                flexShrink: 0,

                zIndex: 15,
              }}
            >
              {error}
            </Alert>
          )}

          {/* =================================================
              CHATGPT-STYLE BOTTOM COMPOSER
          ================================================= */}

          <Box
            sx={{
              position: "sticky",
              bottom: 0,

              flexShrink: 0,

              px: {
                xs: 1,
                sm: 2,
                md: 3.5,
              },

              pt: {
                xs: 0.8,
                sm: 1,
              },

              pb: {
                xs: 0.8,
                sm: 1,
              },

              background:
                "linear-gradient(180deg,rgba(255,255,255,0.72) 0%,rgba(255,255,255,0.97) 30%,#FFFFFF 100%)",

              backdropFilter:
                "blur(14px)",

              WebkitBackdropFilter:
                "blur(14px)",

              borderTop:
                "1px solid rgba(225,234,228,0.72)",

              boxShadow:
                "0 -12px 32px rgba(31,75,50,0.045)",

              zIndex: 20,
            }}
          >
            {/* =================================================
                FILE PREVIEW
            ================================================= */}

            {attachedFile && (
              <Box
                sx={{
                  mb: 0.8,

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  px: 1.2,
                  py: 0.7,

                  borderRadius: 1.8,

                  background:
                    "#F2F8F4",

                  border:
                    "1px solid #DDEBE2",
                }}
              >
                <Typography
                  sx={{
                    fontSize:
                      "0.68rem",

                    color:
                      "#486456",

                    overflow:
                      "hidden",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  📎 {attachedFile.name}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() =>
                    setAttachedFile(
                      null
                    )
                  }
                  sx={{
                    width: 25,
                    height: 25,
                    color:
                      "#75877D",
                  }}
                >
                  ×
                </IconButton>
              </Box>
            )}

            {/* =================================================
                MAIN SEARCH / MESSAGE BAR
            ================================================= */}

            <Paper
              elevation={0}
              sx={{
                width: "100%",

                minHeight: {
                  xs: 58,
                  sm: 62,
                },

                display: "flex",

                alignItems:
                  "center",

                gap: {
                  xs: 0.15,
                  sm: 0.35,
                },

                px: {
                  xs: 0.45,
                  sm: 0.7,
                },

                py: {
                  xs: 0.35,
                  sm: 0.4,
                },

                borderRadius: {
                  xs: 3,
                  sm: 3.2,
                },

                background:
                  "#FBFDFC",

                border:
                  "1px solid #D7E4DD",

                boxShadow:
                  "0 2px 8px rgba(31,75,50,0.025)",

                transition:
                  "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",

                "&:hover": {
                  borderColor:
                    "#CBDDD3",
                },

                "&:focus-within": {
                  borderColor:
                    "rgba(22,138,82,0.42)",

                  background:
                    "#FFFFFF",

                  boxShadow:
                    "0 0 0 3px rgba(22,138,82,0.055)",
                },
              }}
            >
              {/* =================================================
                  ATTACH FILE
              ================================================= */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                hidden
                onChange={
                  handleFileChange
                }
              />

              <IconButton
                aria-label="Attach file"
                disabled={loading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                sx={{
                  width: {
                    xs: 37,
                    sm: 39,
                  },

                  height: {
                    xs: 37,
                    sm: 39,
                  },

                  flexShrink: 0,

                  borderRadius: 2,

                  color: "#6D7E75",

                  "&:hover": {
                    background:
                      "#EDF7F1",

                    color:
                      "#168A52",
                  },

                  "&.Mui-disabled": {
                    color:
                      "#B7C2BC",
                  },
                }}
              >
                <AttachFileOutlinedIcon
                  sx={{
                    fontSize: {
                      xs: 20,
                      sm: 21,
                    },
                  }}
                />
              </IconButton>

              {/* =================================================
                  IMAGE BUTTON
                  Same existing file picker functionality
              ================================================= */}

              <IconButton
                aria-label="Attach image"
                disabled={loading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                sx={{
                  width: {
                    xs: 35,
                    sm: 37,
                  },

                  height: {
                    xs: 35,
                    sm: 37,
                  },

                  flexShrink: 0,

                  borderRadius: 2,

                  color: "#6D7E75",

                  "&:hover": {
                    background:
                      "#EDF7F1",

                    color:
                      "#168A52",
                  },

                  "&.Mui-disabled": {
                    color:
                      "#B7C2BC",
                  },

                  display: {
                    xs: "none",
                    sm: "flex",
                  },
                }}
              >
                <ImageOutlinedIcon
                  sx={{
                    fontSize: 20,
                  }}
                />
              </IconButton>

              {/* =================================================
                  INPUT
              ================================================= */}

              <TextField
                fullWidth
                multiline
                maxRows={4}
                value={question}
                disabled={loading}
                onChange={(event) =>
                  setQuestion(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder={
                  isListening
                    ? "Listening…"
                    : "Message CarbonTrack AI…"
                }
                variant="standard"
                sx={{
                  flex: 1,

                  minWidth: 0,

                  "& .MuiInputBase-root":
                    {
                      px: {
                        xs: 0.45,
                        sm: 0.65,
                      },

                      py: {
                        xs: 0.55,
                        sm: 0.7,
                      },

                      fontSize: {
                        xs: "0.88rem",
                        sm: "0.91rem",
                      },

                      color: "#294338",

                      lineHeight: 1.5,

                      minHeight:
                        "40px",

                      display: "flex",

                      alignItems:
                        "center",
                    },

                  "& .MuiInputBase-input":
                    {
                      lineHeight: 1.5,

                      maxHeight: {
                        xs: 88,
                        sm: 105,
                      },

                      overflowY:
                        "auto !important",

                      "&::-webkit-scrollbar":
                        {
                          width: 4,
                        },

                      "&::-webkit-scrollbar-thumb":
                        {
                          background:
                            "#C9DCD1",

                          borderRadius:
                            10,
                        },
                    },

                  "& .MuiInputBase-input::placeholder":
                    {
                      color: "#98A7A0",

                      opacity: 1,
                    },

                  "& .MuiInputBase-root:before":
                    {
                      display: "none",
                    },

                  "& .MuiInputBase-root:after":
                    {
                      display: "none",
                    },
                }}
              />

              {/* =================================================
                  MICROPHONE
              ================================================= */}

              <IconButton
                aria-label={
                  isListening
                    ? "Stop voice input"
                    : "Voice input"
                }
                disabled={loading}
                onClick={handleMic}
                sx={{
                  width: {
                    xs: 38,
                    sm: 40,
                  },

                  height: {
                    xs: 38,
                    sm: 40,
                  },

                  flexShrink: 0,

                  borderRadius: 2,

                  color:
                    isListening
                      ? "#168A52"
                      : "#687A71",

                  background:
                    isListening
                      ? "#EAF7EF"
                      : "transparent",

                  "&:hover": {
                    background:
                      "#EDF7F1",

                    color:
                      "#168A52",
                  },

                  "&.Mui-disabled": {
                    color:
                      "#B7C2BC",
                  },
                }}
              >
                <MicNoneRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 21,
                      sm: 22,
                    },
                  }}
                />
              </IconButton>

              {/* =================================================
                  SEND BUTTON
              ================================================= */}

              <IconButton
                onClick={() =>
                  void askAI()
                }
                disabled={
                  loading ||
                  !question.trim()
                }
                aria-label="Send message"
                sx={{
                  width: {
                    xs: 42,
                    sm: 44,
                  },

                  height: {
                    xs: 42,
                    sm: 44,
                  },

                  flexShrink: 0,

                  borderRadius: {
                    xs: 2.4,
                    sm: 2.5,
                  },

                  background:
                    "linear-gradient(135deg,#39A96D,#168A52)",

                  color: "#FFFFFF",

                  boxShadow:
                    "0 5px 14px rgba(22,138,82,0.16)",

                  transition:
                    "all 180ms ease",

                  "&:hover": {
                    background:
                      "linear-gradient(135deg,#2F9C63,#117646)",

                    transform:
                      "translateY(-1px)",

                    boxShadow:
                      "0 7px 18px rgba(22,138,82,0.22)",
                  },

                  "&.Mui-disabled": {
                    background:
                      "#E3EBE7",

                    color:
                      "#99A8A1",

                    boxShadow:
                      "none",

                    transform:
                      "none",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress
                    size={18}
                    thickness={5}
                    sx={{
                      color:
                        "#FFFFFF",
                    }}
                  />
                ) : (
                  <SendRoundedIcon
                    sx={{
                      fontSize: {
                        xs: 19,
                        sm: 20,
                      },
                    }}
                  />
                )}
              </IconButton>
            </Paper>

            {/* =================================================
                HELPER TEXT
            ================================================= */}

            <Typography
              sx={{
                mt: {
                  xs: 0.55,
                  sm: 0.65,
                },

                textAlign: "center",

                color: "#9AA7A0",

                fontSize: {
                  xs: "0.56rem",
                  sm: "0.61rem",
                },

                lineHeight: 1.4,

                letterSpacing:
                  "0.05px",

                whiteSpace: {
                  xs: "normal",
                  sm: "nowrap",
                },
              }}
            >
              Enter to send • Shift + Enter for new line
              {" • "}
              🎙 Voice input
              {" • "}
              📎 Attach files
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AIAssistant;