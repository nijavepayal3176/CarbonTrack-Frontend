import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";

import type {
  ChangeEvent,
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
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";

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

interface SpeechRecognitionResultLike {
  0?: {
    transcript: string;
  };
  isFinal?: boolean;
}

interface SpeechRecognitionResultEventLike {
  resultIndex?: number;
  results: {
    length?: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult:
    | ((event: SpeechRecognitionResultEventLike) => void)
    | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
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
    .slice(2, 10)}`;

/* =========================================================
   NORMALIZE REPEATED SPEECH
========================================================= */

const normalizeSpeechText = (text: string) => {
  return text
    .replace(/\s+/g, " ")
    .replace(
      /\b(\w+(?:\s+\w+){0,4})\s+\1\b/gi,
      "$1"
    )
    .trim();
};

/* =========================================================
   CLEAN AI TEXT
========================================================= */

const cleanAIText = (text: string): string => {
  if (!text) return "";

  let cleaned = text;

  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim());

  const hasTable = lines.some(
    (line) =>
      line.startsWith("|") &&
      line.endsWith("|")
  );

  if (hasTable) {
    const filtered = lines.filter(
      (line) =>
        !/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(
          line
        )
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
            .map((cell) => cell.trim())
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
  } else {
    cleaned = lines.join("\n");
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
            color: "inherit",
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
            display: "inline",
            px: 0.65,
            py: 0.2,
            mx: 0.1,
            borderRadius: 0.8,
            background: "#EDF4EF",
            color: "#28704A",
            border: "1px solid #DCE9E0",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.88em",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
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
   PROFESSIONAL / CHATGPT STYLE
========================================================= */

const renderAIAnswer = (
  content: string
): ReactNode => {
  const cleaned = cleanAIText(content);

  if (!cleaned) {
    return null;
  }

  const lines = cleaned.split("\n");

  const elements: ReactNode[] = [];

  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (!bulletBuffer.length) return;

    const bullets = [...bulletBuffer];

    elements.push(
      <Box
        key={`bullet-group-${elements.length}`}
        sx={{
          width: "100%",
          mt: 0.8,
          mb: 1.1,
          minWidth: 0,
        }}
      >
        <Stack
          spacing={0.8}
          sx={{
            width: "100%",
          }}
        >
          {bullets.map(
            (bullet, index) => (
              <Box
                key={`${bullet}-${index}`}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  width: "100%",
                  minWidth: 0,
                  gap: {
                    xs: 0.8,
                    sm: 1,
                  },
                }}
              >
                <CheckCircleRoundedIcon
                  sx={{
                    flexShrink: 0,
                    mt: "4px",
                    fontSize: {
                      xs: 15,
                      sm: 17,
                    },
                    color: "#43A96F",
                  }}
                />

                <Typography
                  component="div"
                  sx={{
                    flex: "1 1 auto",
                    minWidth: 0,
                    maxWidth: "100%",
                    fontSize: "inherit",
                    lineHeight: {
                      xs: 1.72,
                      sm: 1.78,
                    },
                    color: "inherit",
                    overflowWrap:
                      "anywhere",
                    wordBreak:
                      "break-word",
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
          sx={{
            height: {
              xs: 5,
              sm: 7,
            },
          }}
        />
      );

      return;
    }

    /* =====================================================
       HEADINGS
    ===================================================== */

    if (
      line.startsWith("# ") ||
      line.startsWith("## ") ||
      line.startsWith("### ")
    ) {
      flushBullets();

      const heading = line
        .replace(/^#{1,3}\s*/, "")
        .trim();

      elements.push(
        <Box
          key={`heading-${index}`}
          sx={{
            width: "100%",
            mt:
              elements.length > 0
                ? 1.7
                : 0,
            mb: 0.9,
            minWidth: 0,
          }}
        >
          <Typography
            component="div"
            sx={{
              fontSize: {
                xs: "0.91rem",
                sm: "1rem",
              },
              fontWeight: 800,
              color: "#193D2A",
              lineHeight: 1.4,
              letterSpacing:
                "-0.2px",
              overflowWrap:
                "anywhere",
              wordBreak:
                "break-word",
            }}
          >
            {heading}
          </Typography>

          <Box
            sx={{
              width: 30,
              height: 2,
              mt: 0.55,
              borderRadius: 10,
              background:
                "linear-gradient(90deg,#43AA70,#DCEDE3)",
            }}
          />
        </Box>
      );

      return;
    }

    /* =====================================================
       NUMBERED LIST
    ===================================================== */

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
            alignItems: "flex-start",
            width: "100%",
            minWidth: 0,
            gap: {
              xs: 0.8,
              sm: 1,
            },
            mb: 0.8,
          }}
        >
          <Box
            sx={{
              width: {
                xs: 22,
                sm: 24,
              },
              height: {
                xs: 22,
                sm: 24,
              },
              minWidth: {
                xs: 22,
                sm: 24,
              },
              mt: "2px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg,#EAF7EF,#DDF2E5)",
              color: "#168A52",
              border:
                "1px solid #D6EADF",
              fontSize: {
                xs: "0.63rem",
                sm: "0.68rem",
              },
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {numberedMatch[1]}
          </Box>

          <Typography
            component="div"
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              maxWidth: "100%",
              fontSize: "inherit",
              lineHeight: {
                xs: 1.72,
                sm: 1.78,
              },
              overflowWrap:
                "anywhere",
              wordBreak:
                "break-word",
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

    /* =====================================================
       BULLETS
    ===================================================== */

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

    /* =====================================================
       IMPORTANT / RECOMMENDATION
    ===================================================== */

    const lower =
      line.toLowerCase();

    const isImportant =
      lower.includes("important:") ||
      lower.includes("priority:") ||
      lower.includes("best option:") ||
      lower.includes("recommendation:") ||
      lower.includes("most important:") ||
      lower.includes("start with:");

    if (isImportant) {
      elements.push(
        <Box
          key={`important-${index}`}
          sx={{
            width: "100%",
            minWidth: 0,
            my: 1.1,
            px: {
              xs: 1.05,
              sm: 1.35,
            },
            py: {
              xs: 0.95,
              sm: 1.1,
            },
            borderRadius: 2,
            background:
              "linear-gradient(135deg,#F1FAF4 0%,#F8FCF9 100%)",
            border:
              "1px solid #DCEDE3",
            display: "flex",
            alignItems: "flex-start",
            gap: {
              xs: 0.75,
              sm: 0.9,
            },
            boxSizing: "border-box",
          }}
        >
          <LightbulbRoundedIcon
            sx={{
              flexShrink: 0,
              mt: "2px",
              fontSize: {
                xs: 17,
                sm: 19,
              },
              color: "#D49627",
            }}
          />

          <Typography
            component="div"
            sx={{
              flex: "1 1 auto",
              minWidth: 0,
              maxWidth: "100%",
              fontSize: "inherit",
              lineHeight: 1.72,
              overflowWrap:
                "anywhere",
              wordBreak:
                "break-word",
            }}
          >
            {renderInline(line)}
          </Typography>
        </Box>
      );

      return;
    }

    /* =====================================================
       NORMAL PARAGRAPH
    ===================================================== */

    elements.push(
      <Typography
        key={`text-${index}`}
        component="div"
        sx={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          fontSize: "inherit",
          lineHeight: {
            xs: 1.72,
            sm: 1.78,
          },
          color: "inherit",
          overflowWrap:
            "anywhere",
          wordBreak:
            "break-word",
          whiteSpace:
            "pre-wrap",
          mb: 0.45,
        }}
      >
        {renderInline(line)}
      </Typography>
    );
  });

  flushBullets();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "visible",
      }}
    >
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

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(
      null
    );

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const [searchParams] =
    useSearchParams();

  const hasProcessedURLQuestion =
    useRef(false);

  /* =======================================================
     IMAGE PREVIEW
  ======================================================= */

  const imagePreview =
    useMemo(() => {
      if (
        !attachedFile ||
        !attachedFile.type.startsWith(
          "image/"
        )
      ) {
        return null;
      }

      return URL.createObjectURL(
        attachedFile
      );
    }, [attachedFile]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(
          imagePreview
        );
      }
    };
  }, [imagePreview]);

  /* =======================================================
     AUTO SCROLL
  ======================================================= */

  useEffect(() => {
    if (!messagesEndRef.current) {
      return;
    }

    messagesEndRef.current.scrollIntoView(
      {
        behavior: "smooth",
        block: "end",
      }
    );
  }, [messages, loading]);

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
      /*
       * Existing backend contract preserved.
       * File selection remains a UI attachment.
       */

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
     URL QUESTION
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
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.();
        recognitionRef.current?.stop();
      } catch {
        // Ignore speech cleanup errors.
      }
    };
  }, []);

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

      if (
        !loading &&
        question.trim()
      ) {
        void askAI();
      }
    }
  };

  /* =======================================================
     FILE HANDLER
  ======================================================= */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setAttachedFile(file);

    if (!question.trim()) {
      setQuestion(
        `Please analyze this file: ${file.name}`
      );
    }

    event.target.value = "";
  };

  /* =======================================================
     REMOVE FILE
  ======================================================= */

  const removeAttachment = () => {
    const currentFileName =
      attachedFile?.name;

    setAttachedFile(null);

    if (
      currentFileName &&
      question.trim() ===
        `Please analyze this file: ${currentFileName}`
    ) {
      setQuestion("");
    }
  };

  /* =======================================================
     FILE TYPES
  ======================================================= */

  const isImage =
    attachedFile?.type.startsWith(
      "image/"
    ) ?? false;

  const isPDF =
    attachedFile?.type ===
    "application/pdf";

  /* =======================================================
     MICROPHONE
     PROFESSIONAL DUPLICATE FIX
  ======================================================= */

  const handleMic = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors.
      }

      setIsListening(false);
      return;
    }

    const speechWindow =
      window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      };

    const SpeechRecognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice input is not supported in this browser."
      );
      return;
    }

    try {
      const recognition =
        new SpeechRecognition();

      recognitionRef.current =
        recognition;

      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      const baseText =
        question.trim();

      let finalTranscript = "";
      let interimTranscript = "";

      setError("");
      setIsListening(true);

      recognition.onresult = (
        event
      ) => {
        let finalPart = "";
        let interimPart = "";

        const resultLength =
          typeof event.results.length ===
          "number"
            ? event.results.length
            : 0;

        for (
          let i = 0;
          i < resultLength;
          i += 1
        ) {
          const result =
            event.results[i];

          const transcript =
            result?.[0]
              ?.transcript
              ?.trim() || "";

          if (!transcript) {
            continue;
          }

          if (result?.isFinal) {
            finalPart +=
              `${transcript} `;
          } else {
            interimPart +=
              `${transcript} `;
          }
        }

        /*
         * IMPORTANT:
         * SpeechRecognition sends cumulative
         * results. We replace the current voice
         * text instead of appending it repeatedly.
         */

        finalTranscript =
          normalizeSpeechText(
            finalPart
          );

        interimTranscript =
          normalizeSpeechText(
            interimPart
          );

        const voiceText =
          normalizeSpeechText(
            `${finalTranscript} ${interimTranscript}`
          );

        const combined =
          baseText && voiceText
            ? `${baseText} ${voiceText}`
            : baseText ||
              voiceText;

        setQuestion(
          normalizeSpeechText(
            combined
          )
        );
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current =
          null;
      };

      recognition.onerror = () => {
        setIsListening(false);
        recognitionRef.current =
          null;

        setError(
          "Unable to capture voice. Please try again."
        );
      };

      recognition.start();
    } catch (speechError) {
      console.error(
        "Speech recognition error:",
        speechError
      );

      setIsListening(false);
      recognitionRef.current =
        null;

      setError(
        "Unable to start voice input. Please try again."
      );
    }
  };

  /* =========================================================
     UI
  ========================================================= */

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
          xs: 0.5,
          sm: 1.25,
          md: 2.2,
          lg: 3,
        },

        py: {
          xs: 0.6,
          sm: 1.1,
          md: 1.6,
        },

        boxSizing: "border-box",
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
            BRAND
        ================================================= */}

        <Box
          sx={{
            flex: "0 0 auto",
            pb: {
              xs: 0.7,
              sm: 1,
              md: 1.3,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: {
                xs: 0.9,
                sm: 1.2,
              },
            }}
          >
            <Box
              sx={{
                width: {
                  xs: 34,
                  sm: 38,
                },
                height: {
                  xs: 34,
                  sm: 38,
                },
                borderRadius: {
                  xs: 1.8,
                  sm: 2.2,
                },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg,#E9F8EF,#DDF2E5)",

                color: "#168A52",

                border:
                  "1px solid #DCEDE3",

                flexShrink: 0,
              }}
            >
              <AutoAwesomeRoundedIcon
                sx={{
                  fontSize: {
                    xs: 18,
                    sm: 20,
                  },
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
                  fontSize: {
                    xs: "0.94rem",
                    sm: "1.08rem",
                    md: "1.12rem",
                  },
                  fontWeight: 850,
                  color: "#193D2A",
                  letterSpacing:
                    "-0.35px",
                  lineHeight: 1.2,
                }}
              >
                AI Assistant
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.58rem",
                    sm: "0.68rem",
                    md: "0.7rem",
                  },
                  color: "#87968E",
                  mt: 0.15,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Personalized sustainability
                insights
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* =================================================
            MAIN CHAT CARD
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            width: "100%",

            display: "flex",
            flexDirection: "column",

            overflow: "hidden",

            borderRadius: {
              xs: 2.5,
              sm: 3,
              md: 3.5,
              lg: 4,
            },

            background: "#FFFFFF",

            border:
              "1px solid #E1EAE4",

            boxShadow:
              "0 15px 50px rgba(31,75,50,0.075)",

            position: "relative",
          }}
        >
          {/* =================================================
              CHAT HEADER
          ================================================= */}

          <Box
            sx={{
              flex: "0 0 auto",

              px: {
                xs: 1.1,
                sm: 2,
                md: 2.8,
              },

              py: {
                xs: 0.9,
                sm: 1.25,
                md: 1.4,
              },

              borderBottom:
                "1px solid #E9EFEB",

              background:
                "rgba(255,255,255,0.98)",

              zIndex: 5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: {
                  xs: 0.85,
                  sm: 1.25,
                },
                minWidth: 0,
              }}
            >
              {/* AI AVATAR */}

              <Box
                sx={{
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: {
                      xs: 36,
                      sm: 42,
                    },
                    height: {
                      xs: 36,
                      sm: 42,
                    },
                    background:
                      "linear-gradient(135deg,#35A86B,#168A52)",
                    color: "#FFFFFF",
                    boxShadow:
                      "0 6px 18px rgba(22,138,82,0.18)",
                  }}
                >
                  <SmartToyRoundedIcon
                    sx={{
                      fontSize: {
                        xs: 19,
                        sm: 22,
                      },
                    }}
                  />
                </Avatar>

                <Box
                  sx={{
                    position:
                      "absolute",
                    width: {
                      xs: 9,
                      sm: 10,
                    },
                    height: {
                      xs: 9,
                      sm: 10,
                    },
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

              {/* HEADER TEXT */}

              <Box
                sx={{
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.7,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: {
                        xs: "0.8rem",
                        sm: "0.94rem",
                      },
                      fontWeight: 800,
                      color: "#193D2A",
                      whiteSpace:
                        "nowrap",
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
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
                      height: {
                        xs: 19,
                        sm: 21,
                      },
                      flexShrink: 0,
                      fontSize:
                        "0.58rem",
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
                          px: {
                            xs: 0.65,
                            sm: 0.85,
                          },
                        },
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    mt: 0.15,
                    color: "#83938B",
                    fontSize: {
                      xs: "0.58rem",
                      sm: "0.66rem",
                    },
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Your personal sustainability
                  companion
                </Typography>
              </Box>

              {/* PERSONALIZED CHIP */}

              <Box
                sx={{
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                  flexShrink: 0,
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
                    "& .MuiChip-icon":
                      {
                        color: "#48A874",
                      },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* =================================================
              MESSAGES SCROLL AREA
          ================================================= */}

          <Box
            sx={{
              flex: "1 1 0",
              minHeight: 0,
              height: 0,

              overflowY: "auto",
              overflowX: "hidden",

              overscrollBehavior:
                "contain",

              WebkitOverflowScrolling:
                "touch",

              px: {
                xs: 1,
                sm: 2,
                md: 3,
                lg: 4,
              },

              py: {
                xs: 1.4,
                sm: 2,
                md: 2.5,
                lg: 3,
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

              "&::-webkit-scrollbar":
                {
                  width: 5,
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
              /* =================================================
                 EMPTY STATE
              ================================================= */

              <Box
                sx={{
                  minHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  px: {
                    xs: 0.8,
                    sm: 2,
                  },
                  py: {
                    xs: 1.5,
                    sm: 2,
                  },
                  boxSizing: "border-box",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 680,
                    display: "flex",
                    flexDirection:
                      "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  {/* AI ICON */}

                  <Box
                    sx={{
                      position:
                        "relative",
                      mb: {
                        xs: 1.7,
                        sm: 2.4,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: {
                          xs: 64,
                          sm: 78,
                          md: 86,
                        },
                        height: {
                          xs: 64,
                          sm: 78,
                          md: 86,
                        },
                        borderRadius: {
                          xs: "21px",
                          sm: "25px",
                          md: "27px",
                        },
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "linear-gradient(145deg,#EAF8EF,#DDF3E5)",
                        color: "#168A52",
                        border:
                          "1px solid #DCEDE3",
                        boxShadow:
                          "0 16px 35px rgba(22,138,82,0.10)",
                      }}
                    >
                      <AutoAwesomeRoundedIcon
                        sx={{
                          fontSize: {
                            xs: 29,
                            sm: 37,
                            md: 41,
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        position:
                          "absolute",
                        width: {
                          xs: 9,
                          sm: 11,
                        },
                        height: {
                          xs: 9,
                          sm: 11,
                        },
                        right: {
                          xs: -2,
                          sm: -3,
                        },
                        top: {
                          xs: 6,
                          sm: 8,
                        },
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
                        xs: "1.05rem",
                        sm: "1.25rem",
                        md: "1.35rem",
                      },
                      fontWeight: 850,
                      color: "#193D2A",
                      letterSpacing:
                        "-0.45px",
                      lineHeight: 1.3,
                    }}
                  >
                    How can I help you?
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.8,
                      width: "100%",
                      maxWidth: 570,
                      color: "#7B8C83",
                      fontSize: {
                        xs: "0.72rem",
                        sm: "0.8rem",
                        md: "0.84rem",
                      },
                      lineHeight: 1.7,
                    }}
                  >
                    Ask me anything about your
                    carbon footprint,
                    sustainability,
                    transportation, energy,
                    food, or reduction goals.
                  </Typography>

                  {/* TOPICS */}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      flexWrap: "wrap",
                      gap: 0.7,
                      mt: {
                        xs: 1.6,
                        sm: 2.2,
                      },
                      width: "100%",
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
                          height: {
                            xs: 26,
                            sm: 28,
                          },
                          background:
                            "#F5F9F6",
                          border:
                            "1px solid #E1EAE4",
                          color:
                            "#64776C",
                          fontSize: {
                            xs: "0.6rem",
                            sm: "0.66rem",
                          },
                          fontWeight: 650,
                        }}
                      />
                    ))}
                  </Box>

                  {/* QUICK ACTIONS */}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexWrap: "wrap",
                      gap: {
                        xs: 0.7,
                        sm: 1,
                      },
                      mt: {
                        xs: 1.5,
                        sm: 2.2,
                      },
                      width: "100%",
                      maxWidth: 620,
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
                              height: {
                                xs: 32,
                                sm: 34,
                              },
                              maxWidth:
                                "100%",
                              background:
                                "#FFFFFF",
                              border:
                                "1px solid #DDE8E1",
                              color:
                                "#486456",
                              fontSize: {
                                xs: "0.61rem",
                                sm: "0.68rem",
                              },
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
                                  transform:
                                    "translateY(-1px)",
                                },
                              "& .MuiChip-icon":
                                {
                                  color:
                                    "#48A874",
                                  fontSize:
                                    {
                                      xs: "16px",
                                      sm: "18px",
                                    },
                                },
                            }}
                          />
                        )
                      )}
                  </Box>
                </Box>
              </Box>
            ) : (
              /* =================================================
                 CHAT MESSAGES
              ================================================= */

              <Box
                sx={{
                  width: "100%",
                  minWidth: 0,
                }}
              >
                <Stack
                  spacing={{
                    xs: 2,
                    sm: 2.6,
                    md: 3,
                  }}
                  sx={{
                    width: "100%",
                    minWidth: 0,
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
                            width:
                              "100%",
                            minWidth: 0,
                            display:
                              "flex",
                            justifyContent:
                              isUser
                                ? "flex-end"
                                : "flex-start",
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
                              gap: {
                                xs: 0.65,
                                sm: 1,
                              },
                              width:
                                "100%",
                              maxWidth:
                                isUser
                                  ? {
                                      xs: "96%",
                                      sm: "82%",
                                      md: "72%",
                                    }
                                  : {
                                      xs: "100%",
                                      sm: "96%",
                                      md: "91%",
                                    },
                              minWidth: 0,
                            }}
                          >
                            {/* AVATAR */}

                            <Avatar
                              sx={{
                                width: {
                                  xs: 30,
                                  sm: 34,
                                },
                                height: {
                                  xs: 30,
                                  sm: 34,
                                },
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
                                      {
                                        xs: 15,
                                        sm: 17,
                                      },
                                  }}
                                />
                              ) : (
                                <SmartToyRoundedIcon
                                  sx={{
                                    fontSize:
                                      {
                                        xs: 16,
                                        sm: 18,
                                      },
                                  }}
                                />
                              )}
                            </Avatar>

                            {/* CONTENT COLUMN */}

                            <Box
                              sx={{
                                flex:
                                  "1 1 auto",
                                minWidth:
                                  0,
                                maxWidth:
                                  "100%",
                              }}
                            >
                              {/* ROLE */}

                              <Typography
                                sx={{
                                  fontSize:
                                    "0.62rem",
                                  fontWeight:
                                    750,
                                  color:
                                    "#94A099",
                                  mb: 0.45,
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

                              {/* MESSAGE */}

                              <Paper
                                elevation={
                                  0
                                }
                                sx={{
                                  width:
                                    "100%",
                                  maxWidth:
                                    "100%",
                                  minWidth:
                                    0,
                                  boxSizing:
                                    "border-box",

                                  px: {
                                    xs: 1.2,
                                    sm: 1.8,
                                  },

                                  py: {
                                    xs: 1.05,
                                    sm: 1.5,
                                  },

                                  borderRadius:
                                    isUser
                                      ? "17px 17px 5px 17px"
                                      : "5px 17px 17px 17px",

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
                                    xs: "0.78rem",
                                    sm: "0.88rem",
                                  },

                                  lineHeight:
                                    1.75,

                                  overflow:
                                    "visible",

                                  overflowWrap:
                                    "anywhere",

                                  wordBreak:
                                    "break-word",

                                  whiteSpace:
                                    isUser
                                      ? "pre-wrap"
                                      : "normal",
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
                      THINKING
                  ================================================= */}

                  {loading && (
                    <Box
                      sx={{
                        display:
                          "flex",
                        alignItems:
                          "flex-start",
                        gap: {
                          xs: 0.65,
                          sm: 1,
                        },
                        width:
                          "100%",
                        maxWidth: {
                          xs: "98%",
                          sm: "86%",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: {
                            xs: 30,
                            sm: 34,
                          },
                          height: {
                            xs: 30,
                            sm: 34,
                          },
                          flexShrink: 0,
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
                            fontSize: {
                              xs: 16,
                              sm: 18,
                            },
                          }}
                        />
                      </Avatar>

                      <Paper
                        elevation={0}
                        sx={{
                          minWidth: 0,
                          px: {
                            xs: 1.25,
                            sm: 1.7,
                          },
                          py: {
                            xs: 1,
                            sm: 1.25,
                          },
                          borderRadius:
                            "5px 18px 18px 18px",
                          background:
                            "#F8FBF9",
                          border:
                            "1px solid #E1EAE4",
                        }}
                      >
                        <Box
                          sx={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 0.9,
                          }}
                        >
                          <Box
                            sx={{
                              display:
                                "flex",
                              gap: "3px",
                              flexShrink: 0,
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
                                        "30%":
                                          {
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
                              fontSize: {
                                xs: "0.66rem",
                                sm: "0.74rem",
                              },
                              color:
                                "#819189",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            CarbonTrack AI is
                            thinking…
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>
                  )}

                  {/* SCROLL ANCHOR */}

                  <Box
                    ref={messagesEndRef}
                    sx={{
                      height: 1,
                      width: "100%",
                    }}
                  />
                </Stack>
              </Box>
            )}
          </Box>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <Box
              sx={{
                flex:
                  "0 0 auto",
                px: {
                  xs: 0.8,
                  sm: 2,
                  md: 4,
                },
                pt: 0.7,
                background:
                  "#FFFFFF",
                zIndex: 25,
              }}
            >
              <Alert
                severity="error"
                onClose={() =>
                  setError("")
                }
                sx={{
                  borderRadius: 2,
                  py: 0.15,
                  fontSize: "0.7rem",
                  "& .MuiAlert-message":
                    {
                      minWidth: 0,
                      overflowWrap:
                        "anywhere",
                      wordBreak:
                        "break-word",
                    },
                }}
              >
                {error}
              </Alert>
            </Box>
          )}

          {/* =================================================
              STICKY COMPOSER
          ================================================= */}

          <Box
            sx={{
              flex: "0 0 auto",

              position: "sticky",
              bottom: 0,

              width: "100%",

              px: {
                xs: 0.65,
                sm: 1.5,
                md: 3.5,
              },

              pt: {
                xs: 0.65,
                sm: 0.9,
                md: 1,
              },

              pb: {
                xs: 0.65,
                sm: 0.9,
                md: 1,
              },

              boxSizing: "border-box",

              background:
                "linear-gradient(180deg,rgba(255,255,255,0.74) 0%,rgba(255,255,255,0.97) 30%,#FFFFFF 100%)",

              backdropFilter:
                "blur(14px)",

              WebkitBackdropFilter:
                "blur(14px)",

              borderTop:
                "1px solid rgba(225,234,228,0.72)",

              boxShadow:
                "0 -12px 32px rgba(31,75,50,0.045)",

              zIndex: 30,
            }}
          >
            {/* =================================================
                ATTACHMENT PREVIEW
            ================================================= */}

            {attachedFile && (
              <Box
                sx={{
                  mb: 0.8,
                  width: "100%",
                  minWidth: 0,
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 1,
                  px: {
                    xs: 0.9,
                    sm: 1.1,
                  },
                  py: 0.65,
                  borderRadius: 2,
                  background:
                    "#F5FAF7",
                  border:
                    "1px solid #DCEBE2",
                  boxSizing: "border-box",
                }}
              >
                {/* IMAGE */}

                {isImage &&
                imagePreview ? (
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      overflow: "hidden",
                      flexShrink: 0,
                      border:
                        "1px solid #D9E8DF",
                      background:
                        "#EEF6F1",
                    }}
                  >
                    <Box
                      component="img"
                      src={
                        imagePreview
                      }
                      alt={
                        attachedFile.name
                      }
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit:
                          "cover",
                        display:
                          "block",
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      flexShrink: 0,
                      background:
                        "#EAF6EF",
                      color:
                        isPDF
                          ? "#C75B5B"
                          : "#168A52",
                      border:
                        "1px solid #D9E8DF",
                    }}
                  >
                    {isPDF ? (
                      <PictureAsPdfOutlinedIcon
                        sx={{
                          fontSize: 23,
                        }}
                      />
                    ) : (
                      <DescriptionOutlinedIcon
                        sx={{
                          fontSize: 23,
                        }}
                      />
                    )}
                  </Box>
                )}

                {/* FILE DETAILS */}

                <Box
                  sx={{
                    flex:
                      "1 1 auto",
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize:
                        "0.68rem",
                      fontWeight: 750,
                      color:
                        "#355447",
                      overflow:
                        "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {attachedFile.name}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.1,
                      fontSize:
                        "0.58rem",
                      color:
                        "#87988F",
                    }}
                  >
                    {(
                      attachedFile.size /
                      1024
                    ).toFixed(1)}{" "}
                    KB
                  </Typography>
                </Box>

                {/* REMOVE */}

                <IconButton
                  size="small"
                  aria-label="Remove attachment"
                  onClick={
                    removeAttachment
                  }
                  sx={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    color:
                      "#75877D",
                    "&:hover": {
                      background:
                        "#EAF3ED",
                      color:
                        "#C05D5D",
                    },
                  }}
                >
                  <CloseRoundedIcon
                    sx={{
                      fontSize: 17,
                    }}
                  />
                </IconButton>
              </Box>
            )}

            {/* =================================================
                MESSAGE BAR
            ================================================= */}

            <Paper
              elevation={0}
              sx={{
                width: "100%",
                minWidth: 0,

                minHeight: {
                  xs: 52,
                  sm: 58,
                  md: 62,
                },

                display: "flex",
                alignItems:
                  "center",

                gap: {
                  xs: 0.05,
                  sm: 0.3,
                },

                px: {
                  xs: 0.3,
                  sm: 0.55,
                  md: 0.7,
                },

                py: {
                  xs: 0.25,
                  sm: 0.35,
                },

                boxSizing: "border-box",

                borderRadius: {
                  xs: 2.7,
                  sm: 3,
                  md: 3.2,
                },

                background:
                  "#FBFDFC",

                border:
                  "1px solid #D7E4DD",

                boxShadow:
                  "0 2px 8px rgba(31,75,50,0.025)",

                transition:
                  "border-color 180ms ease, box-shadow 180ms ease",

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
              {/* FILE INPUT */}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                hidden
                onChange={
                  handleFileChange
                }
              />

              {/* ATTACH */}

              <IconButton
                aria-label="Attach file"
                disabled={loading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                sx={{
                  width: {
                    xs: 34,
                    sm: 38,
                    md: 39,
                  },
                  height: {
                    xs: 34,
                    sm: 38,
                    md: 39,
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
                  "&.Mui-disabled":
                    {
                      color:
                        "#B7C2BC",
                    },
                }}
              >
                <AttachFileOutlinedIcon
                  sx={{
                    fontSize: {
                      xs: 18,
                      sm: 20,
                    },
                  }}
                />
              </IconButton>

              {/* IMAGE BUTTON */}

              <IconButton
                aria-label="Attach image"
                disabled={loading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                sx={{
                  width: {
                    xs: 34,
                    sm: 36,
                    md: 37,
                  },
                  height: {
                    xs: 34,
                    sm: 36,
                    md: 37,
                  },
                  flexShrink: 0,
                  borderRadius: 2,
                  color: "#6D7E75",
                  display: {
                    xs: "none",
                    sm: "flex",
                  },
                  "&:hover": {
                    background:
                      "#EDF7F1",
                    color:
                      "#168A52",
                  },
                }}
              >
                <ImageOutlinedIcon
                  sx={{
                    fontSize: 19,
                  }}
                />
              </IconButton>

              {/* INPUT */}

              <TextField
                fullWidth
                multiline
                maxRows={5}
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
                  flex:
                    "1 1 auto",
                  minWidth: 0,
                  maxWidth:
                    "100%",

                  "& .MuiInputBase-root":
                    {
                      width:
                        "100%",
                      px: {
                        xs: 0.3,
                        sm: 0.55,
                        md: 0.65,
                      },
                      py: {
                        xs: 0.35,
                        sm: 0.6,
                        md: 0.7,
                      },
                      fontSize: {
                        xs: "0.78rem",
                        sm: "0.87rem",
                        md: "0.91rem",
                      },
                      color: "#294338",
                      lineHeight: 1.5,
                      minHeight:
                        "38px",
                      minWidth: 0,
                    },

                  "& .MuiInputBase-input":
                    {
                      minWidth: 0,
                      lineHeight: 1.5,
                      maxHeight: {
                        xs: 82,
                        sm: 100,
                        md: 105,
                      },
                      overflowY:
                        "auto !important",
                      overflowWrap:
                        "anywhere",
                      wordBreak:
                        "break-word",

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

              {/* MICROPHONE */}

              <IconButton
                aria-label={
                  isListening
                    ? "Stop voice input"
                    : "Voice input"
                }
                disabled={loading}
                onClick={
                  handleMic
                }
                sx={{
                  width: {
                    xs: 35,
                    sm: 39,
                    md: 40,
                  },
                  height: {
                    xs: 35,
                    sm: 39,
                    md: 40,
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

                  "&.Mui-disabled":
                    {
                      color:
                        "#B7C2BC",
                    },
                }}
              >
                <MicNoneRoundedIcon
                  sx={{
                    fontSize: {
                      xs: 19,
                      sm: 21,
                    },
                  }}
                />
              </IconButton>

              {/* SEND */}

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
                    xs: 38,
                    sm: 42,
                    md: 44,
                  },
                  height: {
                    xs: 38,
                    sm: 42,
                    md: 44,
                  },
                  flexShrink: 0,
                  borderRadius: {
                    xs: 2.2,
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

                  "&.Mui-disabled":
                    {
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
                        xs: 18,
                        sm: 20,
                      },
                    }}
                  />
                )}
              </IconButton>
            </Paper>

            {/* =================================================
                HELPER
            ================================================= */}

            <Typography
              sx={{
                mt: {
                  xs: 0.45,
                  sm: 0.6,
                },
                textAlign: "center",
                color: "#9AA7A0",
                fontSize: {
                  xs: "0.5rem",
                  sm: "0.59rem",
                  md: "0.61rem",
                },
                lineHeight: 1.4,
                px: {
                  xs: 0.5,
                  sm: 0,
                },
              }}
            >
              Enter to send • Shift + Enter
              for new line • 🎙 Voice input •
              📎 Attach files
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AIAssistant;