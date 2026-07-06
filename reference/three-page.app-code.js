// Gereconstrueerde app-code uit de productie-bundle three-page.js (nbcevents.nl/3d-plattegrond)
// Alleen het applicatie-deel (na react/three/spline-runtime libs), automatisch geformatteerd vanuit de geminificeerde bundle.
// Variabelenamen zijn geminificeerd; zie docs/architectuur-analyse.md voor duiding.
var Ge = JC(Cf()),
  _X = "https://prod.spline.design/WYaImsxT39yxxRTM/scene.splinecode",
  YX = "https://prod.spline.design/MuaKWnAMFOVPl8N1/scene.splinecode",
  HX = "https://prod.spline.design/FpxJYC5tSwzsTaix/scene.splinecode",
  OX = "https://prod.spline.design/dqpO8e8KKB82COmG/scene.splinecode",
  PX = "/assets/js/spline/congres/scene.splinecode",
  zX = "/assets/js/spline/feest/scene.splinecode",
  jX = "/assets/js/spline/sitdown/scene.splinecode",
  WX = "/assets/js/spline/lounge/scene.splinecode",
  ha =
    typeof window != "undefined" && window.REACT_THREE_CONFIG
      ? window.REACT_THREE_CONFIG
      : {},
  Qk = typeof ha.useLocalSpline == "boolean" ? ha.useLocalSpline : !0,
  lk = Qk ? PX : _X,
  aqA = Qk ? zX : YX,
  rqA = Qk ? jX : HX,
  sqA = Qk ? WX : OX,
  UX = Array.isArray(ha.sharedTooltipCards) ? ha.sharedTooltipCards : [],
  RX = Array.isArray(ha.loungeTooltipCards) ? ha.loungeTooltipCards : [],
  nqA = Array.isArray(ha.sharedSpaceTooltips) ? ha.sharedSpaceTooltips : [],
  CqA = Array.isArray(ha.loungeSpaceTooltips) ? ha.loungeSpaceTooltips : [],
  NX = Array.isArray(ha.modeButtonLabels) ? ha.modeButtonLabels : [],
  FX = Array.isArray(ha.floorButtonLabels) ? ha.floorButtonLabels : [],
  vs = ha.wizard && typeof ha.wizard == "object" ? ha.wizard : {},
  BqA = typeof vs.title == "string" ? vs.title : "",
  lqA = typeof vs.paragraph == "string" ? vs.paragraph : "",
  QqA = Array.isArray(vs.items) ? vs.items : [],
  EqA = typeof vs.titleMobile == "string" ? vs.titleMobile : "",
  hqA = typeof vs.paragraphMobile == "string" ? vs.paragraphMobile : "",
  cqA = Array.isArray(vs.itemsMobile) ? vs.itemsMobile : [];
function bX(A) {
  let e = Array.isArray(A)
    ? A.map((t) => ({
        text: typeof (t == null ? void 0 : t.text) == "string" ? t.text : "",
      }))
    : [];
  for (; e.length < 4; ) e.push({ text: "" });
  return e.slice(0, 4);
}
var Fh = "w-10 h-10 shrink-0 text-blackout";
function VX() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 40 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M20 35C28.2843 35 35 28.2843 35 20C35 11.7157 28.2843 5 20 5C11.7157 5 5 11.7157 5 20C5 28.2843 11.7157 35 20 35Z",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeMiterlimit: "10",
      }),
      (0, Ge.jsx)("path", {
        d: "M13.75 20H26.25",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M20 13.75V26.25",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  });
}
function uqA() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 40 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M22.5 3.75H17.5C12.6675 3.75 8.75 7.66751 8.75 12.5V27.5C8.75 32.3325 12.6675 36.25 17.5 36.25H22.5C27.3325 36.25 31.25 32.3325 31.25 27.5V12.5C31.25 7.66751 27.3325 3.75 22.5 3.75Z",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M20 17.5V3.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M8.75 17.5H31.25",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M12.6895 5.18945L20.0004 12.5004",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M9.33887 9.33984L17.4998 17.5008",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  });
}
function dqA() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 40 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M22.5 3.75H17.5C12.6675 3.75 8.75 7.66751 8.75 12.5V27.5C8.75 32.3325 12.6675 36.25 17.5 36.25H22.5C27.3325 36.25 31.25 32.3325 31.25 27.5V12.5C31.25 7.66751 27.3325 3.75 22.5 3.75Z",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M20 17.5V3.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M8.75 17.5H31.25",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M27.3109 5.18945L20 12.5004",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M30.6609 9.33984L22.5 17.5008",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  });
}
function pqA() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 40 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M22.5 3.75H17.5C12.6675 3.75 8.75 7.66751 8.75 12.5V27.5C8.75 32.3325 12.6675 36.25 17.5 36.25H22.5C27.3325 36.25 31.25 32.3325 31.25 27.5V12.5C31.25 7.66751 27.3325 3.75 22.5 3.75Z",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M23.75 13.75L20 10L16.25 13.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M23.75 26.25L20 30L16.25 26.25",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M20 10V30",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  });
}
function fqA() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 40 40",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M10.0004 33.75L5.41913 25.9375C5.01127 25.2201 4.90371 24.3706 5.11992 23.5742C5.33613 22.7778 5.85857 22.0993 6.57321 21.6866C7.28786 21.274 8.13671 21.1608 8.9345 21.3718C9.7323 21.5827 10.4143 22.1006 10.8316 22.8125L13.7504 27.5V10.625C13.7504 9.7962 14.0796 9.00134 14.6657 8.41529C15.2517 7.82924 16.0466 7.5 16.8754 7.5C17.7042 7.5 18.499 7.82924 19.0851 8.41529C19.6711 9.00134 20.0004 9.7962 20.0004 10.625V19.375C20.0004 18.5462 20.3296 17.7513 20.9157 17.1653C21.5017 16.5792 22.2966 16.25 23.1254 16.25C23.9542 16.25 24.749 16.5792 25.3351 17.1653C25.9211 17.7513 26.2504 18.5462 26.2504 19.375V21.875C26.2504 21.0462 26.5796 20.2513 27.1657 19.6653C27.7517 19.0792 28.5466 18.75 29.3754 18.75C30.2042 18.75 30.999 19.0792 31.5851 19.6653C32.1711 20.2513 32.5004 21.0462 32.5004 21.875V27.5C32.5004 31.25 31.2504 33.75 31.2504 33.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M27.5 8.75H38.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      (0, Ge.jsx)("path", {
        d: "M32.5 3.75L27.5 8.75L32.5 13.75",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ],
  });
}
function DqA() {
  return (0, Ge.jsx)("svg", {
    className: Fh,
    viewBox: "0 0 28 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: (0, Ge.jsx)("path", {
      d: "M21.4999 11.5C21.0849 11.5 20.6999 11.627 20.3799 11.844C20.1069 11.064 19.3719 10.5 18.4999 10.5C18.1339 10.5 17.7949 10.606 17.4999 10.778V3.5C17.4999 2.397 16.6029 1.5 15.4999 1.5C14.6279 1.5 13.8929 2.064 13.6199 2.844C13.2999 2.627 12.9149 2.5 12.4999 2.5C11.3969 2.5 10.4999 3.397 10.4999 4.5V17.472C10.4999 17.545 10.4559 17.579 10.4179 17.595C10.3819 17.611 10.3269 17.619 10.2729 17.566L8.67993 15.973C7.72693 15.019 6.33893 14.692 5.06193 15.119C4.61993 15.266 4.27993 15.604 4.12793 16.044C3.97693 16.484 4.03893 16.96 4.29693 17.347L7.58393 22.277C8.11293 23.07 8.69193 23.801 9.30493 24.448C10.5399 25.752 12.3239 26.499 14.1979 26.499H16.6939C19.5159 26.499 22.0159 24.806 23.0649 22.186C23.3539 21.463 23.5009 20.7 23.5009 19.92V13.499C23.5009 12.396 22.6039 11.499 21.5009 11.499L21.4999 11.5ZM22.4999 19.921C22.4999 20.573 22.3769 21.211 22.1349 21.816C21.2389 24.054 19.1029 25.5 16.6929 25.5H14.1969C12.5959 25.5 11.0769 24.866 10.0299 23.761C9.45593 23.155 8.91293 22.469 8.41493 21.722L5.12793 16.792C5.04393 16.666 5.02393 16.511 5.07293 16.368C5.12193 16.225 5.23293 16.115 5.37693 16.067C6.29393 15.763 7.28793 15.996 7.97193 16.68L9.56493 18.273C9.88993 18.598 10.3739 18.694 10.7989 18.519C11.2239 18.343 11.4979 17.932 11.4979 17.472V4.5C11.4979 3.949 11.9469 3.5 12.4979 3.5C13.0489 3.5 13.4979 3.949 13.4979 4.5V12.5C13.4979 12.776 13.7219 13 13.9979 13C14.2739 13 14.4979 12.776 14.4979 12.5V3.5C14.4979 2.949 14.9469 2.5 15.4979 2.5C16.0489 2.5 16.4979 2.949 16.4979 3.5V13C16.4979 13.276 16.7219 13.5 16.9979 13.5C17.2739 13.5 17.4979 13.276 17.4979 13V12.5C17.4979 11.949 17.9469 11.5 18.4979 11.5C19.0489 11.5 19.4979 11.949 19.4979 12.5V14C19.4979 14.276 19.7219 14.5 19.9979 14.5C20.2739 14.5 20.4979 14.276 20.4979 14V13.5C20.4979 12.949 20.9469 12.5 21.4979 12.5C22.0489 12.5 22.4979 12.949 22.4979 13.5V19.921H22.4999Z",
      fill: "currentColor",
    }),
  });
}
function yqA() {
  return (0, Ge.jsxs)("svg", {
    className: Fh,
    viewBox: "0 0 28 28",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": !0,
    children: [
      (0, Ge.jsx)("path", {
        d: "M23.5002 11.5C23.0862 11.5 22.7002 11.627 22.3802 11.844C22.1072 11.064 21.3712 10.5 20.5002 10.5C20.0862 10.5 19.7002 10.627 19.3802 10.844C19.1072 10.064 18.3712 9.5 17.5002 9.5C17.1342 9.5 16.7952 9.606 16.5002 9.778V3.5C16.5002 2.397 15.6032 1.5 14.5002 1.5C13.3972 1.5 12.5002 2.397 12.5002 3.5V17.472C12.5002 17.545 12.4552 17.579 12.4182 17.595C12.3812 17.611 12.3252 17.619 12.2732 17.566L10.6792 15.973C9.72618 15.019 8.34018 14.692 7.06118 15.119C6.62018 15.266 6.28018 15.603 6.12818 16.044C5.97718 16.485 6.03818 16.96 6.29718 17.348L9.58318 22.278C10.1142 23.074 10.6932 23.805 11.3042 24.449C12.5392 25.753 14.3232 26.5 16.1972 26.5H18.6932C21.5152 26.5 24.0152 24.807 25.0632 22.187C25.3532 21.464 25.5002 20.701 25.5002 19.921V13.5C25.5002 12.397 24.6032 11.5 23.5002 11.5ZM24.5002 19.921C24.5002 20.573 24.3772 21.211 24.1362 21.816C23.2402 24.054 21.1052 25.5 18.6942 25.5H16.1982C14.5972 25.5 13.0792 24.866 12.0322 23.761C11.4602 23.157 10.9162 22.472 10.4172 21.723L7.13118 16.793C7.04718 16.667 7.02718 16.512 7.07618 16.368C7.12518 16.225 7.23518 16.116 7.37918 16.067C8.29618 15.763 9.29118 15.997 9.97418 16.68L11.5682 18.273C11.8922 18.598 12.3782 18.693 12.8022 18.519C13.2272 18.343 13.5012 17.932 13.5012 17.472V3.5C13.5012 2.949 13.9492 2.5 14.5012 2.5C15.0532 2.5 15.5012 2.949 15.5012 3.5V12.5C15.5012 12.776 15.7252 13 16.0012 13C16.2772 13 16.5012 12.776 16.5012 12.5V11.5C16.5012 10.949 16.9492 10.5 17.5012 10.5C18.0532 10.5 18.5012 10.949 18.5012 11.5V13C18.5012 13.276 18.7252 13.5 19.0012 13.5C19.2772 13.5 19.5012 13.276 19.5012 13V12.5C19.5012 11.949 19.9492 11.5 20.5012 11.5C21.0532 11.5 21.5012 11.949 21.5012 12.5V14C21.5012 14.276 21.7252 14.5 22.0012 14.5C22.2772 14.5 22.5012 14.276 22.5012 14V13.5C22.5012 12.949 22.9492 12.5 23.5012 12.5C24.0532 12.5 24.5012 12.949 24.5012 13.5L24.5002 19.921Z",
        fill: "currentColor",
      }),
      (0, Ge.jsx)("path", {
        d: "M7.646 9.35495C7.744 9.45295 7.872 9.50095 8 9.50095C8.128 9.50095 8.256 9.45195 8.354 9.35495L10.5 7.20895V9.00195C10.5 9.27795 10.724 9.50195 11 9.50195C11.276 9.50195 11.5 9.27795 11.5 9.00195V6.00195C11.5 5.93695 11.487 5.87195 11.462 5.81095C11.411 5.68895 11.314 5.59095 11.191 5.53995C11.13 5.51495 11.065 5.50195 11 5.50195H8C7.724 5.50195 7.5 5.72595 7.5 6.00195C7.5 6.27795 7.724 6.50195 8 6.50195H9.793L7.647 8.64795C7.452 8.84295 7.451 9.15995 7.646 9.35495Z",
        fill: "currentColor",
      }),
      (0, Ge.jsx)("path", {
        d: "M6.5 14C6.5 13.724 6.276 13.5 6 13.5H4.207L6.353 11.354C6.548 11.159 6.548 10.842 6.353 10.647C6.158 10.452 5.841 10.452 5.646 10.647L3.5 12.793V11C3.5 10.724 3.276 10.5 3 10.5C2.724 10.5 2.5 10.724 2.5 11V14C2.5 14.065 2.513 14.13 2.538 14.191C2.589 14.313 2.686 14.411 2.809 14.462C2.87 14.487 2.935 14.5 3 14.5H6C6.276 14.5 6.5 14.276 6.5 14Z",
        fill: "currentColor",
      }),
    ],
  });
}
var wqA = [uqA, dqA, pqA, VX],
  mqA = [fqA, DqA, yqA, VX];
function SqA({ variant: A, index: e }) {
  let t = e % 4,
    g = (A === "desktop" ? wqA : mqA)[t];
  return (0, Ge.jsx)(g, {});
}
var ZX = [
    "tooltip-event-hall",
    "tooltip-grand-hall",
    "tooltip-hospitality-area-1",
    "tooltip-hospitality-area-2",
  ],
  XX = "tooltip-eventhall-scheidingswand",
  MqA = "Wegneembare wand",
  TJ = [
    "tooltip-grand-hall-balkon",
    "tooltip-grand-hall-stoelen-in-de-zaal",
    "tooltip-grand-hall-podium",
    "tooltip-grand-hall-projectiescherm",
    "tooltip-grand-hall-ruimte-op-te-splitsen",
    "tooltip-hospitality1-veel-daglicht-entree",
    "tooltip-hospitality1-ingang",
    "tooltip-hospitality1-registratiebalies",
    "tooltip-hospitality1-bewaakte-garderobe",
    "tooltip-hospitality2-vaste-bar",
    "tooltip-hospitality2-LED-wall-entree",
    "tooltip-hospitality2-entresol",
    "tooltip-hospitality2-wijnbar",
    "tooltip-hospitality2-LED-zuilen",
    "tooltip-eventhall-3dprojectie",
    "tooltip-eventhall-stoelen-in-de-zaal",
    XX,
  ],
  $X = ["tooltip-lounge", "tooltip-sub-zalen"],
  _J = [
    "tooltip-lounge-presentatie-scherm-subzaal",
    "tooltip-lounge-subzalen combineren",
    "tooltip-lounge-subzaal",
    "tooltip-lounge-registratiebalies",
    "tooltip-lounge-hospitality-area-midden",
  ],
  GqA = [
    {
      label: "Balkon",
      cardTitle: "Balkon",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Stoelen in de zaal",
      cardTitle: "Stoelen in de zaal",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Podium",
      cardTitle: "Podium",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Projectiescherm",
      cardTitle: "Projectiescherm",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Ruimte op te splitsen",
      cardTitle: "Ruimte op te splitsen",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Veel daglicht entree",
      cardTitle: "Veel daglicht entree",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Ingang",
      cardTitle: "Ingang",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Registratiebalies",
      cardTitle: "Registratiebalies",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Bewaakte garderobe",
      cardTitle: "Bewaakte garderobe",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Vaste bar",
      cardTitle: "Vaste bar",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "LED wall entree",
      cardTitle: "LED wall entree",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Entresol",
      cardTitle: "Entresol",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Wijnbar",
      cardTitle: "Wijnbar",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "LED zuilen",
      cardTitle: "LED zuilen",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "3D projectie",
      cardTitle: "3D projectie",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Stoelen in de zaal",
      cardTitle: "Stoelen in de zaal",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Scheidingswand",
      cardTitle: "Scheidingswand",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
  ],
  kqA = [
    {
      label: "Presentatiescherm subzaal",
      cardTitle: "Presentatiescherm subzaal",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Subzalen combineren",
      cardTitle: "Subzalen combineren",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Subzaal",
      cardTitle: "Subzaal",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Registratiebalies",
      cardTitle: "Registratiebalies",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
    {
      label: "Hospitality area midden",
      cardTitle: "Hospitality area midden",
      cardDescription: "",
      cardLink: "",
      cardLinkText: "Meer informatie",
    },
  ],
  va =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="%234C5E64"><path d="M16 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10M6 24c0-3.866 3.582-7 8-7h4c4.418 0 8 3.134 8 7v2H6z"/></svg>',
  vqA = [
    {
      label: "Event hall",
      cardTitle: "Event hall",
      cardDescription:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur facilisis sem in risus cursus, at varius dui feugiat.",
      cardLink: "/",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Bekijk ruimte",
      defaultImage: "https://picsum.photos/seed/space-eventhall/1200/675",
      imageVariants: [
        {
          imageUrl: "https://picsum.photos/seed/space-eventhall-a/1200/675",
          capacityLabel: "1.500",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
        {
          imageUrl: "https://picsum.photos/seed/space-eventhall-b/1200/675",
          capacityLabel: "2.000",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
      ],
    },
    {
      label: "Grand hall",
      cardTitle: "Grand hall",
      cardDescription:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin posuere libero ac orci varius, sed luctus enim bibendum.",
      cardLink: "/",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Bekijk ruimte",
      defaultImage: "https://picsum.photos/seed/space-grandhall/1200/675",
      imageVariants: [
        {
          imageUrl: "https://picsum.photos/seed/space-grandhall-a/1200/675",
          capacityLabel: "1.200",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
        {
          imageUrl: "https://picsum.photos/seed/space-grandhall-b/1200/675",
          capacityLabel: "1.700",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
      ],
    },
    {
      label: "Hospitality area 1",
      cardTitle: "Hospitality area 1",
      cardDescription:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer volutpat mi id ligula dictum, sed porta odio laoreet.",
      cardLink: "/",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Bekijk ruimte",
      defaultImage: "https://picsum.photos/seed/space-hospitality1/1200/675",
      imageVariants: [
        {
          imageUrl: "https://picsum.photos/seed/space-hospitality1-a/1200/675",
          capacityLabel: "750",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
        {
          imageUrl: "https://picsum.photos/seed/space-hospitality1-b/1200/675",
          capacityLabel: "900",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
      ],
    },
    {
      label: "Hospitality area 2",
      cardTitle: "Hospitality area 2",
      cardDescription:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi vel dui id ligula cursus varius in non justo.",
      cardLink: "/",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Bekijk ruimte",
      defaultImage: "https://picsum.photos/seed/space-hospitality2/1200/675",
      imageVariants: [
        {
          imageUrl: "https://picsum.photos/seed/space-hospitality2-a/1200/675",
          capacityLabel: "870",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
        {
          imageUrl: "https://picsum.photos/seed/space-hospitality2-b/1200/675",
          capacityLabel: "1.050",
          iconLeftUrl: va,
          iconRightUrl: va,
        },
      ],
    },
  ],
  UqA = [
    {
      label: "Lounge",
      cardTitle: "Lounge",
      cardDescription: "",
      cardLink: "",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Meer informatie",
    },
    {
      label: "Sub-zalen",
      cardTitle: "Sub-zalen",
      cardDescription: "",
      cardLink: "",
      cardLinkOpenInNewTab: !1,
      cardLinkText: "Meer informatie",
    },
  ];
function A6(A, e, t) {
  return Array.from({ length: t }, (i, g) => ({
    ...(e[g] || {}),
    ...(Array.isArray(A) && A[g] ? A[g] : {}),
  }));
}
var il = UX.length >= TJ.length ? UX.slice(0, TJ.length) : GqA,
  gl = RX.length >= _J.length ? RX.slice(0, _J.length) : kqA,
  yC = A6(nqA, vqA, ZX.length),
  wC = A6(CqA, UqA, $X.length),
  ap = TJ.map((A, e) => {
    var t, i, g, I, o, a, r, s;
    return {
      splineName: A,
      tooltipType: "info",
      label: ((t = il[e]) == null ? void 0 : t.label) || A,
      cardTitle: ((i = il[e]) == null ? void 0 : i.cardTitle) || "",
      cardDescription: ((g = il[e]) == null ? void 0 : g.cardDescription) || "",
      cardLink: ((I = il[e]) == null ? void 0 : I.cardLink) || "",
      cardLinkOpenInNewTab: !!((o = il[e]) != null && o.cardLinkOpenInNewTab),
      cardLinkText:
        ((a = il[e]) == null ? void 0 : a.cardLinkText) || "Meer informatie",
      defaultImage: ((r = il[e]) == null ? void 0 : r.defaultImage) || null,
      imageVariants: Array.isArray(
        (s = il[e]) == null ? void 0 : s.imageVariants,
      )
        ? il[e].imageVariants
        : [],
    };
  }),
  rp = ZX.map((A, e) => {
    var t, i, g, I, o, a, r, s, n;
    return {
      splineName: A,
      tooltipType: "space",
      label: ((t = yC[e]) == null ? void 0 : t.label) || A,
      cardTitle:
        ((i = yC[e]) == null ? void 0 : i.cardTitle) ||
        ((g = yC[e]) == null ? void 0 : g.label) ||
        A,
      cardDescription: ((I = yC[e]) == null ? void 0 : I.cardDescription) || "",
      cardLink: ((o = yC[e]) == null ? void 0 : o.cardLink) || "",
      cardLinkOpenInNewTab: !!((a = yC[e]) != null && a.cardLinkOpenInNewTab),
      cardLinkText:
        ((r = yC[e]) == null ? void 0 : r.cardLinkText) || "Meer informatie",
      defaultImage: ((s = yC[e]) == null ? void 0 : s.defaultImage) || null,
      imageVariants: Array.isArray(
        (n = yC[e]) == null ? void 0 : n.imageVariants,
      )
        ? yC[e].imageVariants
        : [],
    };
  }),
  xX = _J.map((A, e) => {
    var t, i, g, I, o, a, r, s;
    return {
      splineName: A,
      tooltipType: "info",
      label: ((t = gl[e]) == null ? void 0 : t.label) || A,
      cardTitle: ((i = gl[e]) == null ? void 0 : i.cardTitle) || "",
      cardDescription: ((g = gl[e]) == null ? void 0 : g.cardDescription) || "",
      cardLink: ((I = gl[e]) == null ? void 0 : I.cardLink) || "",
      cardLinkOpenInNewTab: !!((o = gl[e]) != null && o.cardLinkOpenInNewTab),
      cardLinkText:
        ((a = gl[e]) == null ? void 0 : a.cardLinkText) || "Meer informatie",
      defaultImage: ((r = gl[e]) == null ? void 0 : r.defaultImage) || null,
      imageVariants: Array.isArray(
        (s = gl[e]) == null ? void 0 : s.imageVariants,
      )
        ? gl[e].imageVariants
        : [],
    };
  }),
  KX = $X.map((A, e) => {
    var t, i, g, I, o, a, r, s, n;
    return {
      splineName: A,
      tooltipType: "space",
      label: ((t = wC[e]) == null ? void 0 : t.label) || A,
      cardTitle:
        ((i = wC[e]) == null ? void 0 : i.cardTitle) ||
        ((g = wC[e]) == null ? void 0 : g.label) ||
        A,
      cardDescription: ((I = wC[e]) == null ? void 0 : I.cardDescription) || "",
      cardLink: ((o = wC[e]) == null ? void 0 : o.cardLink) || "",
      cardLinkOpenInNewTab: !!((a = wC[e]) != null && a.cardLinkOpenInNewTab),
      cardLinkText:
        ((r = wC[e]) == null ? void 0 : r.cardLinkText) || "Meer informatie",
      defaultImage: ((s = wC[e]) == null ? void 0 : s.defaultImage) || null,
      imageVariants: Array.isArray(
        (n = wC[e]) == null ? void 0 : n.imageVariants,
      )
        ? wC[e].imageVariants
        : [],
    };
  }),
  Bk = {
    [_X]: [...rp, ...ap],
    [PX]: [...rp, ...ap],
    [YX]: [...rp, ...ap],
    [zX]: [...rp, ...ap],
    [HX]: [...rp, ...ap],
    [jX]: [...rp, ...ap],
    [OX]: [...KX, ...xX],
    [WX]: [...KX, ...xX],
  },
  RqA = "Visible",
  NqA = "Hidden";
function FqA(A, e) {
  if (!A) return;
  let t = e.trim(),
    i = A.findObjectByName(t);
  return (
    i ||
    (typeof A.getAllObjects == "function" &&
      (i = A.getAllObjects().find((I) => (I.name || "").trim() === t)),
    i)
  );
}
function bqA(A, e, t) {
  if (!(A != null && A.findObjectByName)) return;
  let g = (Bk[e] || []).findIndex((a) => a.splineName === XX);
  if (g === -1) return;
  let I = FqA(A, MqA);
  if (!I) return;
  let o = t === g ? RqA : NqA;
  if (typeof I.transition == "function")
    try {
      I.transition({ to: o, duration: 0 }).play();
      return;
    } catch (a) {}
  I.state = o;
}
var xqA = ["Congress", "Party", "Sit down dinner"],
  qJ = NX.length === 3 ? NX : xqA,
  JX = [
    { key: "congres", sceneUrl: lk, label: qJ[0] },
    { key: "feest", sceneUrl: aqA, label: qJ[1] },
    { key: "sitdown", sceneUrl: rqA, label: qJ[2] },
  ],
  KqA = 0,
  JqA = ["1", "2"],
  qX = FX.length === 2 ? FX : JqA;
function qqA(A, e, t, i) {
  (A.updateMatrixWorld && A.updateMatrixWorld(),
    i.set(0, 0, 0),
    A.matrixWorld ? i.setFromMatrixPosition(A.matrixWorld) : i.copy(A.position),
    typeof i.project == "function" && i.project(e));
  let g = t ? t.clientWidth : window.innerWidth,
    I = t ? t.clientHeight : window.innerHeight,
    o = (i.x * 0.5 + 0.5) * g,
    a = (-(i.y * 0.5) + 0.5) * I;
  return { x: o, y: a, visible: Math.abs(i.z) <= 1 };
}
function LqA() {
  return (0, Ge.jsx)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "10",
    height: "6",
    viewBox: "0 0 8 5",
    "aria-hidden": "true",
    children: (0, Ge.jsx)("path", {
      fillRule: "evenodd",
      clipRule: "evenodd",
      d: "M0.175736 4.42436C-0.0585786 4.19005 -0.0585786 3.81015 0.175736 3.57583L3.57574 0.175833C3.81005 -0.0584811 4.18995 -0.0584811 4.42426 0.175833L7.82426 3.57583C8.05858 3.81015 8.05858 4.19005 7.82426 4.42436C7.58995 4.65868 7.21005 4.65868 6.97574 4.42436L4 1.44863L1.02426 4.42436C0.78995 4.65868 0.41005 4.65868 0.175736 4.42436Z",
      fill: "currentColor",
    }),
  });
}
function YJ() {
  return (0, Ge.jsx)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    className: "w-3.5 h-3.5",
    "aria-hidden": "true",
    children: (0, Ge.jsx)("path", { d: "M18 6L6 18M6 6l12 12" }),
  });
}
function TqA({
  card: A,
  onClose: e,
  mobileExpanded: t,
  onMobileExpandedChange: i,
  onMobileHeightChange: g,
}) {
  var m;
  let I = A.cardTitle || A.label,
    o = A.cardDescription,
    a = A.cardLink,
    r = !!A.cardLinkOpenInNewTab,
    s = A.cardLinkText || "Meer informatie",
    n = A.defaultImage || null,
    C = A.imageVariants || [],
    B = n || C.some((R) => R.imageUrl),
    l = (0, Ni.useRef)(null),
    [Q, E] = (0, Ni.useState)(null);
  (0, Ni.useEffect)(() => {
    !t ||
      !l.current ||
      !g ||
      requestAnimationFrame(() => {
        l.current && g(l.current.offsetHeight);
      });
  }, [t]);
  let h = () => i(!t),
    c = Q !== null && (m = C[Q]) != null && m.imageUrl ? C[Q].imageUrl : n,
    u = B
      ? (0, Ge.jsxs)("div", {
          className:
            "overflow-hidden relative w-full bg-cover rounded-2xl aspect-video",
          onMouseLeave: () => E(null),
          children: [
            n &&
              (0, Ge.jsx)("img", {
                src: n,
                alt: "",
                className: `object-cover absolute inset-0 w-full h-full transition-opacity duration-300 ${Q === null ? "opacity-100" : "opacity-0"}`,
                loading: "lazy",
              }),
            C.map(
              (R, F) =>
                R.imageUrl &&
                (0, Ge.jsx)(
                  "img",
                  {
                    src: R.imageUrl,
                    alt: "",
                    className: `object-cover absolute inset-0 w-full h-full transition-opacity duration-300 ${Q === F ? "opacity-100" : "opacity-0"}`,
                    loading: "lazy",
                  },
                  F,
                ),
            ),
          ],
        })
      : null,
    p = ({ url: R }) =>
      (0, Ge.jsx)("span", {
        "aria-hidden": !0,
        className: "w-4 h-4 shrink-0 bg-blackout",
        style: {
          WebkitMaskImage: `url("${R}")`,
          maskImage: `url("${R}")`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        },
      }),
    D =
      C.length > 0
        ? (0, Ge.jsx)("div", {
            className: "flex flex-wrap gap-2",
            children: C.map((R, F) =>
              (0, Ge.jsxs)(
                "button",
                {
                  type: "button",
                  className: (Q !== null ? Q === F : F === 0)
                    ? "flex gap-1 items-center justify-center px-2 py-1 rounded-sm border border-whiteout bg-whiteout transition-colors"
                    : "flex gap-1 items-center justify-center px-2 py-1 rounded-sm border border-neutral-200 bg-neutral-200 transition-colors hover:bg-neutral-100",
                  onMouseEnter: () => E(F),
                  onFocus: () => E(F),
                  onClick: () => E(F),
                  children: [
                    R.iconLeftUrl && (0, Ge.jsx)(p, { url: R.iconLeftUrl }),
                    R.capacityLabel &&
                      (0, Ge.jsx)("span", {
                        className: "font-extrabold label-xs text-blackout",
                        children: R.capacityLabel,
                      }),
                    R.iconRightUrl && (0, Ge.jsx)(p, { url: R.iconRightUrl }),
                  ],
                },
                F,
              ),
            ),
          })
        : null,
    w = C.length > 0,
    M =
      I || o || a
        ? (0, Ge.jsxs)("div", {
            className: "flex flex-col gap-3",
            children: [
              I &&
                (0, Ge.jsx)("h3", {
                  className:
                    "pr-10 font-sans text-base font-extrabold md:text-sm xl:text-base text-whiteout",
                  children: I,
                }),
              o &&
                (0, Ge.jsx)("p", {
                  className:
                    "font-sans text-sm md:text-xs 2xl:text-sm text-whiteout",
                  children: o,
                }),
              a &&
                (0, Ge.jsx)("a", {
                  href: a,
                  target: r ? "_blank" : void 0,
                  rel: r ? "noopener noreferrer" : void 0,
                  className:
                    "font-semibold underline transition-colors font-sans text-xs md:text-sm text-whiteout! hover:underline",
                  children: s,
                }),
            ],
          })
        : null,
    S =
      o || a
        ? (0, Ge.jsxs)("div", {
            className: "flex flex-col gap-3",
            children: [
              o &&
                (0, Ge.jsx)("p", {
                  className: "text-base leading-relaxed text-whiteout",
                  children: o,
                }),
              a &&
                (0, Ge.jsx)("a", {
                  href: a,
                  target: r ? "_blank" : void 0,
                  rel: r ? "noopener noreferrer" : void 0,
                  className: "text-base font-semibold underline text-whiteout",
                  children: s,
                }),
            ],
          })
        : null;
  return (0, Ge.jsxs)(Ge.Fragment, {
    children: [
      (0, Ge.jsx)("div", {
        className:
          "hidden absolute left-6 top-1/2 z-50 w-full lg:max-w-[22.5vw] -translate-y-1/2 lg:block",
        style: { pointerEvents: "auto" },
        onMouseLeave: () => E(null),
        children: (0, Ge.jsxs)("div", {
          className:
            "flex relative flex-col p-6 rounded-3xl shadow-xl bg-neutral-800",
          children: [
            (0, Ge.jsx)("button", {
              type: "button",
              onClick: e,
              "aria-label": "Kaart sluiten",
              className:
                "flex z-10 justify-center items-center w-8 h-8 rounded-full transition-colors text-whiteout bg-blackout hover:bg-blackout lg:absolute lg:top-8 lg:right-8",
              children: (0, Ge.jsx)(YJ, {}),
            }),
            u,
            u && w && (0, Ge.jsx)("div", { className: "h-6" }),
            u && !w && M && (0, Ge.jsx)("div", { className: "h-6" }),
            D,
            D && M && (0, Ge.jsx)("div", { className: "h-6" }),
            M,
          ],
        }),
      }),
      (0, Ge.jsx)("div", {
        className: "absolute right-0 bottom-0 left-0 z-50 lg:hidden",
        style: {
          transform: t ? "translateY(0)" : "translateY(calc(100% - 45px))",
          transition: "transform 0.3s ease",
          pointerEvents: "auto",
        },
        children: (0, Ge.jsxs)("div", {
          ref: l,
          className:
            "flex overflow-hidden flex-col rounded-t-3xl shadow-2xl bg-neutral-800",
          style: { paddingBottom: "env(safe-area-inset-bottom, 0px)" },
          children: [
            (0, Ge.jsxs)("div", {
              className:
                "flex gap-3 items-center px-6 cursor-pointer select-none",
              style: { minHeight: 45 },
              onClick: h,
              children: [
                (0, Ge.jsx)("h3", {
                  className:
                    "flex-1 pr-2 text-lg font-extrabold leading-tight truncate text-whiteout",
                  children: I,
                }),
                (0, Ge.jsxs)("div", {
                  className: "flex gap-2 items-center shrink-0",
                  children: [
                    (0, Ge.jsx)("button", {
                      type: "button",
                      className:
                        "flex justify-center items-center w-8 h-8 rounded-full text-whiteout bg-blackout/50",
                      style: {
                        transform: t ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                      },
                      "aria-label": "Toon of verberg informatie",
                      onClick: (R) => {
                        (R.stopPropagation(), h());
                      },
                      children: (0, Ge.jsx)(LqA, {}),
                    }),
                    (0, Ge.jsx)("button", {
                      type: "button",
                      className:
                        "flex justify-center items-center w-8 h-8 rounded-full transition-colors text-whiteout bg-blackout/50 hover:bg-blackout/70",
                      "aria-label": "Sluiten",
                      onClick: (R) => {
                        (R.stopPropagation(), e());
                      },
                      children: (0, Ge.jsx)(YJ, {}),
                    }),
                  ],
                }),
              ],
            }),
            t &&
              (0, Ge.jsxs)("div", {
                className: "flex flex-col px-6 pb-6",
                onMouseLeave: () => E(null),
                children: [
                  u,
                  u && w && (0, Ge.jsx)("div", { className: "h-6" }),
                  u && !w && S && (0, Ge.jsx)("div", { className: "h-6" }),
                  D,
                  D && S && (0, Ge.jsx)("div", { className: "h-6" }),
                  S,
                ],
              }),
          ],
        }),
      }),
    ],
  });
}
function _qA({
  open: A,
  onClose: e,
  title: t,
  paragraph: i,
  items: g,
  titleMobile: I,
  paragraphMobile: o,
  itemsMobile: a,
}) {
  let [r, s] = (0, Ni.useState)(
    typeof window != "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : !0,
  );
  (0, Ni.useEffect)(() => {
    if (typeof window == "undefined") return;
    let h = window.matchMedia("(min-width: 1024px)"),
      c = () => s(h.matches);
    return (
      h.addEventListener("change", c),
      () => h.removeEventListener("change", c)
    );
  }, []);
  let n = bX(g),
    B = bX(a).map((h, c) => {
      var u;
      return { text: (u = h.text) != null && u.trim() ? h.text : n[c].text };
    }),
    l = r ? t : (I == null ? void 0 : I.trim()) || t,
    Q = r ? i : (o == null ? void 0 : o.trim()) || i,
    E = r ? n : B;
  return A
    ? (0, Ge.jsx)("div", {
        className:
          "flex fixed inset-0 justify-center items-center p-6 backdrop-blur-sm z-100 bg-blackout/20",
        onMouseDown: e,
        children: (0, Ge.jsxs)("div", {
          className:
            "relative w-full max-w-[720px] rounded-3xl shadow-xl bg-blackout overflow-hidden",
          onMouseDown: (h) => h.stopPropagation(),
          role: "dialog",
          "aria-modal": "true",
          children: [
            (0, Ge.jsx)("button", {
              type: "button",
              onClick: e,
              "aria-label": "Wizard sluiten",
              className:
                "flex absolute top-4 right-4 justify-center items-center w-8 h-8 rounded-full transition-colors text-blackout bg-whiteout hover:bg-whiteout",
              children: (0, Ge.jsx)(YJ, {}),
            }),
            (0, Ge.jsxs)("div", {
              className: "flex flex-col gap-4 px-8 pt-8 pb-8",
              children: [
                l &&
                  (0, Ge.jsx)("h3", {
                    className:
                      "font-sans text-[1.65rem] font-extrabold leading-tight text-whiteout",
                    children: l,
                  }),
                Q &&
                  (0, Ge.jsx)("p", {
                    className:
                      "font-sans text-sm leading-relaxed text-whiteout",
                    children: Q,
                  }),
                (0, Ge.jsx)("div", {
                  className: "grid grid-cols-1 gap-4 mt-4 md:grid-cols-2",
                  children: E.map((h, c) =>
                    (0, Ge.jsxs)(
                      "div",
                      {
                        className: "flex gap-4 items-center min-w-0",
                        children: [
                          (0, Ge.jsx)("div", {
                            className:
                              "flex justify-center items-center rounded-full shrink-0 bg-whiteout size-16",
                            "aria-hidden": !0,
                            children: (0, Ge.jsx)(SqA, {
                              variant: r ? "desktop" : "mobile",
                              index: c,
                            }),
                          }),
                          (0, Ge.jsx)("span", {
                            className:
                              "min-w-0 font-sans text-sm font-semibold text-whiteout",
                            children: h.text,
                          }),
                        ],
                      },
                      c,
                    ),
                  ),
                }),
              ],
            }),
          ],
        }),
      })
    : null;
}
function YqA({ sceneUrl: A }) {
  let e = (0, Ni.useRef)(null),
    t = (0, Ni.useRef)([]),
    i = (0, Ni.useRef)([]),
    g = (0, Ni.useRef)(null),
    I = (0, Ni.useRef)(new Zi()),
    o = (0, Ni.useRef)(null),
    [a, r] = (0, Ni.useState)(KqA),
    [s, n] = (0, Ni.useState)(1),
    [C, B] = (0, Ni.useState)(A),
    [l, Q] = (0, Ni.useState)(null),
    E = (0, Ni.useRef)(null),
    [h, c] = (0, Ni.useState)(!1),
    [u, p] = (0, Ni.useState)(56),
    [D, w] = (0, Ni.useState)(
      typeof window != "undefined"
        ? window.matchMedia("(min-width: 1024px)").matches
        : !0,
    ),
    [M, S] = (0, Ni.useState)(
      typeof window != "undefined"
        ? window.matchMedia("(min-width: 1800px)").matches
        : !1,
    ),
    [m, R] = (0, Ni.useState)(56),
    [F, x] = (0, Ni.useState)(0),
    _ = "reactThreeWizardDismissedV1",
    [P, T] = (0, Ni.useState)(!1),
    X = () => {
      T(!1);
      try {
        window.localStorage.setItem(_, "1");
      } catch (GA) {}
    };
  ((0, Ni.useEffect)(() => {
    if (typeof window != "undefined")
      try {
        let GA = window.localStorage.getItem(_);
        T(!GA);
      } catch (GA) {
        T(!0);
      }
  }, []),
    (0, Ni.useEffect)(() => {
      let GA = window.matchMedia("(min-width: 1024px)"),
        hA = (qA) => w(qA.matches);
      return (
        GA.addEventListener("change", hA),
        () => GA.removeEventListener("change", hA)
      );
    }, []),
    (0, Ni.useEffect)(() => {
      let GA = window.matchMedia("(min-width: 1536px)"),
        hA = (qA) => S(qA.matches);
      return (
        GA.addEventListener("change", hA),
        () => GA.removeEventListener("change", hA)
      );
    }, []),
    (0, Ni.useEffect)(() => {
      if (typeof document == "undefined") return;
      let GA = () => {
        var WA;
        let bA = document.querySelector("header nav > div.absolute"),
          NA = document.querySelector("header"),
          YA =
            (bA == null ? void 0 : bA.getBoundingClientRect()) ||
            (NA == null ? void 0 : NA.getBoundingClientRect()),
          XA = (WA = YA == null ? void 0 : YA.height) != null ? WA : 0;
        R(XA > 0 ? Math.round(XA) + 8 : 56);
      };
      GA();
      let hA = document.querySelector("header"),
        qA = null;
      return (
        hA &&
          typeof ResizeObserver != "undefined" &&
          ((qA = new ResizeObserver(() => GA())), qA.observe(hA)),
        window.addEventListener("resize", GA),
        () => {
          (window.removeEventListener("resize", GA), qA && qA.disconnect());
        }
      );
    }, []),
    (0, Ni.useEffect)(() => {
      if (typeof document == "undefined") return;
      let GA = document.querySelector("[data-react-three-wizard-toggle]");
      if (!GA) return;
      let hA = () => T(!0);
      return (
        GA.addEventListener("click", hA),
        () => GA.removeEventListener("click", hA)
      );
    }, []),
    (0, Ni.useEffect)(() => {
      if (!P) return;
      let GA = (hA) => {
        hA.key === "Escape" && X();
      };
      return (
        window.addEventListener("keydown", GA),
        () => window.removeEventListener("keydown", GA)
      );
    }, [P]),
    (0, Ni.useEffect)(() => {
      ((i.current = []), Q(null), c(!1), p(56));
    }, [C]));
  let oA = (GA) => {
    g.current = GA;
    let hA = Bk[C] || [],
      qA = new Array(hA.length).fill(null);
    (hA.forEach(({ splineName: NA, label: YA }, XA) => {
      let WA = GA.findObjectByName(NA);
      WA && ((WA.visible = !1), (qA[XA] = { obj: WA, label: YA }));
    }),
      (i.current = qA));
    let bA = () => {
      var He;
      let NA = g.current;
      if (!NA || i.current.length === 0) {
        o.current = requestAnimationFrame(bA);
        return;
      }
      let YA = NA.camera || NA._camera,
        XA = NA.canvas;
      if (!YA || !XA) {
        o.current = requestAnimationFrame(bA);
        return;
      }
      let WA = I.current,
        ZA = e.current;
      if (!ZA) {
        o.current = requestAnimationFrame(bA);
        return;
      }
      let Ke = XA.getBoundingClientRect(),
        de = ZA.getBoundingClientRect(),
        be = Ke.width / (XA.clientWidth || 1),
        Je = Ke.height / (XA.clientHeight || 1),
        ke = Bk[C] || [],
        De = (fe, CA) => {
          let { x: gA, y: HA, visible: ue } = qqA(fe, YA, XA, WA);
          CA.style.display = ue ? "block" : "none";
          let $ = Ke.left + gA * be,
            Ae = Ke.top + HA * Je,
            _e = $ - de.left,
            le = Ae - de.top;
          return (
            (CA.style.left = "0"),
            (CA.style.top = "0"),
            (CA.style.transform = `translate(${_e}px, ${le}px) translate(-50%, -50%)`),
            { overlayX: _e, overlayY: le, visible: ue }
          );
        };
      for (let fe = 0; fe < i.current.length; fe += 1) {
        let CA = i.current[fe],
          gA = t.current[fe];
        if (!gA) continue;
        if (!CA || !CA.obj) {
          gA.style.display = "none";
          continue;
        }
        let HA = De(CA.obj, gA),
          ue = ((He = ke[fe]) == null ? void 0 : He.tooltipType) === "space";
        if ((E.current === fe || ue) && HA != null && HA.visible) {
          let $ = gA.querySelector("button");
          if ($ && typeof $.getBoundingClientRect == "function") {
            let _e = $.getBoundingClientRect().right - de.right;
            if (_e > 0) {
              let ae = HA.overlayX - _e - 10;
              gA.style.transform = `translate(${ae}px, ${HA.overlayY}px) translate(-50%, -50%)`;
            }
          }
        }
      }
      o.current = requestAnimationFrame(bA);
    };
    ((o.current = requestAnimationFrame(bA)), x((NA) => NA + 1));
  };
  (0, Ni.useEffect)(() => {
    let GA = g.current;
    GA && bqA(GA, C, l);
  }, [l, C, F]);
  let lA = (GA) => {
      (r(GA), n(1), B(JX[GA].sceneUrl));
    },
    W = (GA) => {
      (n(GA), GA === 1 ? (B(lk), r(0)) : (B(sqA), r(-1)));
    },
    nA = (GA) => {
      Q((hA) => (hA !== GA && c(!1), hA === GA ? null : GA));
    };
  ((0, Ni.useEffect)(
    () => () => {
      o.current && cancelAnimationFrame(o.current);
    },
    [],
  ),
    (0, Ni.useEffect)(() => {
      E.current = l;
    }, [l]));
  let fA = Bk[C] || [],
    EA = fA.length > 0,
    pA = l !== null ? fA[l] : null,
    RA = l !== null,
    SA = D ? (M ? 48 : 24) : RA ? (h ? u + 16 : 80) : 24;
  return (0, Ge.jsxs)("div", {
    style: { position: "absolute", inset: 0, width: "100%", height: "100%" },
    children: [
      (0, Ge.jsx)(nJ, { scene: C, onLoad: oA }, C),
      EA &&
        (0, Ge.jsx)("div", {
          ref: e,
          style: { position: "absolute", inset: 0, pointerEvents: "none" },
          children: fA.map(({ label: GA, tooltipType: hA }, qA) => {
            let bA = l === qA,
              NA = hA === "space",
              YA = NA || bA;
            return (0, Ge.jsx)(
              "div",
              {
                ref: (de) => {
                  t.current[qA] = de;
                },
                style: {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto",
                  display: "none",
                },
                children: (0, Ge.jsxs)("button", {
                  type: "button",
                  onClick: () => nA(qA),
                  className: YA
                    ? "inline-flex items-center gap-2 h-10 rounded-full bg-blackout px-2 text-whiteout shadow-xl transition-all duration-300"
                    : "inline-flex items-center justify-center rounded-full bg-transparent transition-all duration-300 size-6",
                  children: [
                    (0, Ge.jsx)("span", {
                      className: NA
                        ? "flex justify-center items-center size-6 rounded-full bg-secondary-500 text-whiteout select-none shrink-0"
                        : "flex justify-center items-center size-6 rounded-full bg-whiteout text-blackout select-none shrink-0",
                      children: bA
                        ? (0, Ge.jsx)("svg", {
                            className: "size-[11px]",
                            viewBox: "0 0 32 32",
                            fill: "none",
                            xmlns: "http://www.w3.org/2000/svg",
                            "aria-hidden": "true",
                            children: (0, Ge.jsx)("path", {
                              d: "M8 16H24",
                              stroke: "currentColor",
                              strokeWidth: "2.5",
                              strokeLinecap: "round",
                            }),
                          })
                        : (0, Ge.jsx)("svg", {
                            className: "size-[11px]",
                            viewBox: "0 0 32 32",
                            fill: "none",
                            xmlns: "http://www.w3.org/2000/svg",
                            "aria-hidden": "true",
                            children: (0, Ge.jsx)("path", {
                              d: "M16 8V24M8 16H24",
                              stroke: "currentColor",
                              strokeWidth: "2.5",
                              strokeLinecap: "round",
                            }),
                          }),
                    }),
                    (0, Ge.jsx)("span", {
                      className:
                        "overflow-hidden text-xs font-extrabold tracking-normal whitespace-nowrap transition-all duration-300",
                      style: {
                        maxWidth: YA ? 260 : 0,
                        paddingRight: YA ? 12 : 0,
                      },
                      children: GA,
                    }),
                  ],
                }),
              },
              `tooltip-${C}-${qA}`,
            );
          }),
        }),
      RA &&
        pA &&
        (0, Ge.jsx)(
          TqA,
          {
            card: pA,
            onClose: () => {
              (Q(null), c(!1), p(56));
            },
            mobileExpanded: h,
            onMobileExpandedChange: c,
            onMobileHeightChange: p,
          },
          l,
        ),
      (0, Ge.jsx)("div", {
        className:
          "flex absolute right-6 z-50 flex-row gap-1 p-1 rounded-full border transition-all duration-300 lg:right-16 border-white/20 bg-blackout",
        style: { bottom: SA, pointerEvents: "auto" },
        children: [1, 2].map((GA) =>
          (0, Ge.jsx)(
            "button",
            {
              type: "button",
              onClick: () => W(GA),
              className:
                s === GA
                  ? "flex items-center justify-center px-6 py-2 rounded-full bg-whiteout text-sm font-extrabold text-blackout shadow-sm transition-colors"
                  : "flex items-center justify-center px-6 py-2 rounded-full bg-transparent text-sm font-extrabold text-whiteout transition-colors hover:bg-whiteout/10",
              children: GA === 1 ? qX[0] : qX[1],
            },
            GA,
          ),
        ),
      }),
      s !== 2 &&
        (0, Ge.jsx)("div", {
          className:
            "flex absolute left-1/2 z-50 gap-1 p-1 whitespace-nowrap rounded-full border transition-all duration-300 -translate-x-1/2 border-white/20 bg-blackout",
          style: D
            ? { bottom: SA, pointerEvents: "auto" }
            : { top: m, pointerEvents: "auto" },
          children: JX.map(({ key: GA, label: hA }, qA) =>
            (0, Ge.jsx)(
              "button",
              {
                type: "button",
                onClick: () => lA(qA),
                className:
                  a === qA
                    ? "rounded-full bg-whiteout px-6 py-2 text-sm font-extrabold text-blackout shadow-sm transition-colors"
                    : "rounded-full bg-transparent px-6 py-2 text-sm font-extrabold text-whiteout transition-colors hover:bg-whiteout/10",
                children: hA,
              },
              GA,
            ),
          ),
        }),
      (0, Ge.jsx)(_qA, {
        open: P,
        onClose: X,
        title: BqA,
        paragraph: lqA,
        items: QqA,
        titleMobile: EqA,
        paragraphMobile: hqA,
        itemsMobile: cqA,
      }),
    ],
  });
}
function LX({ sceneUrl: A, showTooltips: e }) {
  return e
    ? (0, Ge.jsx)("div", {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        },
        children: (0, Ge.jsx)(YqA, { sceneUrl: A }),
      })
    : (0, Ge.jsx)("div", {
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        },
        children: (0, Ge.jsx)(nJ, { scene: A }),
      });
}
function TX() {
  let A = document.getElementById("react-three-page-root");
  (A &&
    (0, LJ.createRoot)(A).render(
      (0, Ge.jsx)(LX, { sceneUrl: lk, showTooltips: !0 }),
    ),
    document.querySelectorAll("[data-react-three-root]").forEach((e) => {
      var g;
      if (e._reactThreeMounted) return;
      e._reactThreeMounted = !0;
      let t = ((g = e.dataset.splineScene) == null ? void 0 : g.trim()) || lk;
      (0, LJ.createRoot)(e).render(
        (0, Ge.jsx)(LX, { sceneUrl: t, showTooltips: !1 }),
      );
    }));
}
typeof document != "undefined" &&
  (document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", TX)
    : TX());
