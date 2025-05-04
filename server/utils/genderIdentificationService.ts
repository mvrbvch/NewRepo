export class GenderIdentificationService {
  private maleEndings = ["o", "r", "l", "s", "z", "ão", "u"];
  private femaleEndings = ["a", "e", "i", "inha", "ete", "ona", "osa", "inha", "ela", "ete"];

  public identifyGender(name: string): "male" | "female" | "unknown" {
    if (!name) return "unknown";

    const firstName = name.split(" ")[0].toLowerCase();
    const lastChar = firstName.slice(-1);

    if (this.maleEndings.some(ending => firstName.endsWith(ending))) {
      return "male";
    } else if (this.femaleEndings.some(ending => firstName.endsWith(ending))) {
      return "female";
    }

    return "unknown";
  }
}