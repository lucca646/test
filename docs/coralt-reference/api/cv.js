import { apiFetch } from "./http";

const CV_ANALYSIS_POLL_MS = 3000;
const CV_ANALYSIS_MAX_WAIT_MS = 120_000;

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** URL d’aperçu du CV PDF (ouvre dans un nouvel onglet). */
export function getCvViewUrl(email) {
  if (!email) return "";
  return `/api/plan3/cv?email=${encodeURIComponent(email)}`;
}

export async function fetchCvAnalysisStatus() {
  return apiFetch("/api/plan3/cv-analysis/status");
}

/**
 * Poll l'analyse CV jusqu'à done/error. N'interrompt pas l'upload HTTP.
 * @returns {() => void} cancel
 */
export function watchCvAnalysis({ onUpdate, onDone, onError }) {
  let cancelled = false;
  const started = Date.now();

  const tick = async () => {
    if (cancelled) return;
    try {
      const data = await fetchCvAnalysisStatus();
      onUpdate?.(data);
      const st = data?.analysis_status;
      if (st === "done") {
        onDone?.(data);
        return;
      }
      if (st === "error") {
        onError?.(new Error(data.analysis_error || "L'analyse du CV a échoué."));
        return;
      }
      if (Date.now() - started >= CV_ANALYSIS_MAX_WAIT_MS) {
        onError?.(
          new Error(
            "L'analyse prend plus de temps que prévu. Revenez plus tard ou relancez l'analyse.",
          ),
        );
        return;
      }
      setTimeout(tick, CV_ANALYSIS_POLL_MS);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  };

  void tick();
  return () => {
    cancelled = true;
  };
}

export async function uploadCv(email, file) {
  const formData = new FormData();
  formData.append("cv", file);

  return apiFetch("/api/plan3/upload_cv", {
    method: "POST",
    body: formData,
  });
}

export async function analyzeCv(email) {
  await apiFetch("/api/plan3/analyze_cv", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function deleteCv(email) {
  return apiFetch("/api/plan3/delete_cv", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
