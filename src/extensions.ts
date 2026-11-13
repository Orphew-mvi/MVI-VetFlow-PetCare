import { app } from "@wix/astro/builders";
import newPetCareLead from "./extensions/backend/events/new-petcare-lead/new-petcare-lead.extension";

export default app().use(newPetCareLead);
