// src/lib/mindra/followUps.ts
export function buildFollowUpEN(evKey: string) {
  switch (evKey) {
    case "reconciled_father":
      return "You told me you made peace with your dad… how are things between you two now? 🤍";
    case "fired_job":
      return "You mentioned the job situation… how are you holding up now? Any next step already?";
    case "passed_exam":
      return "Hey, how did you feel after that exam result? You deserved that win 🙂";
    default:
      return "Hey… quick check-in: how are things going with what you told me earlier? 🤍";
  }
}

export function buildFollowUpES(evKey: string) {
  switch (evKey) {
    case "reconciled_father":
      return "Me dijiste que arreglaste las cosas con tu papá… ¿cómo van ahora? 🤍";
    case "fired_job":
      return "Sobre el tema del trabajo… ¿cómo estás hoy? ¿Ya pensaste en el siguiente paso?";
    case "passed_exam":
      return "¿Cómo te sentiste con ese resultado? Te lo merecías 🙂";
    default:
      return "Mini check-in: ¿cómo va eso que me contaste el otro día? 🤍";
  }
}
