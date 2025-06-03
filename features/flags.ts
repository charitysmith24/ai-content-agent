export enum FeatureFlag {
  TRANSCRIPTION = "transcription",
  IMAGE_GENERATION = "image-generation",
  ANALYSE_VIDEO = "analyze-video",
  TITLE_GENERATION = "title-generations",
  SCRIPT_GENERATION = "script-generation",
  STORYBOARD_WORKSPACE = "storyboard-workspace",
  SCENE_IMAGE_GENERATION = "scene-image-generation",
  VOICEOVER_GENERATION = "voiceover-generation",
  SCRIPTS_GENERATION = "scripts-generation",
}

export const featureFlagEvents: Record<FeatureFlag, { event: string }> = {
  [FeatureFlag.TRANSCRIPTION]: {
    event: "transcribe",
  },
  [FeatureFlag.IMAGE_GENERATION]: {
    event: "generate-image",
  },
  [FeatureFlag.ANALYSE_VIDEO]: {
    event: "analyze-video",
  },
  [FeatureFlag.TITLE_GENERATION]: {
    event: "generate-title",
  },
  [FeatureFlag.SCRIPT_GENERATION]: {
    event: "generate-script",
  },
  [FeatureFlag.SCRIPTS_GENERATION]: {
    event: "generate-scripts",
  },
  [FeatureFlag.STORYBOARD_WORKSPACE]: {
    event: "workspace-enabled",
  },
  [FeatureFlag.SCENE_IMAGE_GENERATION]: {
    event: "scene-image-generation",
  },
  [FeatureFlag.VOICEOVER_GENERATION]: {
    event: "voiceover-generation",
  },
};
