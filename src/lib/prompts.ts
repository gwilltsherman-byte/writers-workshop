// Prompt generator for the writing game. Each list below is dealt like a
// shuffled deck: every entry comes up once before any repeats, then the deck
// reshuffles. Templates mix the decks together, so the same full prompt
// practically never shows up twice. Pure module, safe on server and client.

export type BonusWord = { word: string; meaning: string };
export type GamePrompt = { text: string; twist?: string; bonus?: BonusWord };

type Rand = () => number;

/** Deals items in a random order, reshuffling once every item has been used. */
export class ShuffleBag<T> {
  private deck: T[] = [];
  constructor(private readonly items: readonly T[], private readonly rand: Rand = Math.random) {}
  next(): T {
    if (this.deck.length === 0) {
      this.deck = [...this.items];
      for (let i = this.deck.length - 1; i > 0; i--) {
        const j = Math.floor(this.rand() * (i + 1));
        [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
      }
    }
    return this.deck.pop()!;
  }
}

const CHARACTERS = [
  "a retired lighthouse keeper", "a night-shift nurse", "a kid who just learned to whistle",
  "a wedding photographer", "a ghost who’s bad at haunting", "a beekeeper", "a substitute teacher",
  "a long-haul trucker", "a woman who collects other people’s keys", "the last mail carrier in town",
  "a chess hustler", "a dog walker with too many dogs", "a translator", "a magician’s assistant",
  "a man who has never told a lie", "a baker who’s up before dawn", "a teenager on their first day of work",
  "a grandmother learning to text", "a hotel night clerk", "a museum guard", "a wildfire lookout",
  "a street musician", "a locksmith", "a funeral singer", "a lifeguard at an empty pool", "a mapmaker",
  "a radio DJ on the graveyard shift", "an astronaut home after a year away", "a twin who hasn’t spoken to their sibling in years",
  "a debt collector with a soft heart", "a fortune teller who’s never been right", "a janitor at a famous school",
];

const SETTINGS = [
  "at a laundromat at 3 a.m.", "on the last ferry of the night", "in a town where it hasn’t rained in years",
  "at a wedding where nobody knows the couple", "in a hospital waiting room", "on a stalled train",
  "in a diner off the highway", "at the bottom of a drained swimming pool", "in a house that’s about to be torn down",
  "at a county fair", "on a fishing boat in thick fog", "in a library after closing", "at a bus stop in the snow",
  "in a greenhouse in the middle of winter", "at a high school reunion", "on the roof of an apartment building",
  "in a motel with one working light", "at an airport during a blizzard", "in a garden nobody looks after anymore",
  "at a yard sale", "in an empty parking garage", "on a mountain road with no guardrail",
  "in the back room of a pawn shop", "at a lake that froze overnight", "in a city where the power just went out",
  "at a funeral for someone nobody liked", "in the back of a moving van", "on the first hot day of summer",
  "at a hotel pool that’s closed for the season", "in an empty movie theater",
];

const OBJECTS = [
  "a key that doesn’t fit anything", "a voicemail from a number that no longer exists", "a jar of buttons",
  "a map with one street crossed out", "a pair of muddy boots", "a birthday cake nobody ordered",
  "a photograph with someone cut out of it", "a letter that was never sent", "a broken compass", "a borrowed coat",
  "a recipe in someone else’s handwriting", "a lottery ticket", "an old cassette tape", "a stopped wristwatch",
  "a bag of oranges", "a library book twenty years overdue", "a wedding ring in a coat pocket",
  "a lighter that won’t light", "a dog-eared paperback", "a jar of seawater",
  "a postcard from a place that doesn’t exist", "an envelope full of cash", "a hand-drawn map", "a single glove",
  "a shoebox of old receipts", "a toy rocket", "a phone with 1% battery", "a houseplant someone forgot to water",
  "a spare key under the mat", "a typewriter with one missing letter",
];

// Each finishes the sentence "Write a scene where ..."
const SITUATIONS = [
  "someone tells the truth for the first time in years", "a secret comes out at the worst possible moment",
  "two people want the same thing and only one can have it", "someone has to say goodbye without saying why",
  "a plan goes wrong in a small, embarrassing way", "someone goes back to a place they swore they’d never return to",
  "an apology shows up far too late", "someone is pretending to be somebody else, and it’s starting to work",
  "a stranger knows something they shouldn’t", "someone realizes they’ve been wrong about something for years",
  "a promise gets broken for a good reason", "someone has one hour to fix a mistake",
  "an argument is really about something else", "two old friends realize they don’t like each other anymore",
  "someone gets exactly what they asked for", "a small lie gets out of hand",
  "someone waits for a person who isn’t coming", "a celebration slowly falls apart",
  "someone has to choose between being kind and being honest", "a family dinner goes quiet all at once",
];

// Each follows a character, e.g. "a beekeeper ..."
const PREDICAMENTS = [
  "wants to quit but can’t say it out loud", "needs a favor from someone they once wronged",
  "is keeping a secret from everyone in the room", "has been lying about where they were last night",
  "is about to get caught", "is trying very hard not to cry", "just won something they didn’t want",
  "has to give a speech in ten minutes", "is meeting someone from the internet for the first time",
  "forgot something important and is only now remembering", "is the only one who noticed",
  "is pretending everything is fine", "owes someone a lot of money", "wants their old life back",
  "is about to make a terrible decision", "just got good news and can’t tell anyone",
];

const FIRST_LINES = [
  "Nobody in my family talks about the summer of the flood.", "The note on the fridge said only: Don’t.",
  "By the time the band started playing, the groom was gone.", "I knew the house was haunted because it kept apologizing.",
  "She hadn’t meant to steal the dog.", "The last bus left without us.",
  "My father kept a list of everyone he’d never forgive.", "It was the kind of town where everybody waved.",
  "We found the boat exactly where Grandpa said it would be.", "The machine had one button, and it said NO.",
  "Everyone at the party was pretending not to know about the fire.", "It took me forty years to open the letter.",
  "The weather report just said: Stay inside.", "I’d been a ghost for three days before anyone noticed.",
  "There were two rules at the motel, and I broke both on the first night.", "The parrot was the only witness.",
  "Mom said the woods would be quiet that time of year. She was wrong.", "I got the call at 4:12 in the morning.",
  "He’d been practicing this conversation in the car for a week.", "The town held its breath every time the siren tested.",
];

const TWISTS = [
  "Write it entirely in dialogue.", "Keep it under 150 words.", "Don’t use the word “said.”",
  "Write it in second person (“you”).", "Tell it as a string of text messages.",
  "Write it as a letter to someone who will never read it.", "Work in a smell, a sound, and something you can touch.",
  "Nobody is allowed to say what they really mean.", "End on a question.", "The whole thing happens in under a minute.",
  "Make the weather matter.", "Open with a line of dialogue.", "Make it funny.",
  "Make it sad without anyone saying they’re sad.", "No adjectives.", "Your first sentence can only be three words long.",
  "Somebody has to be lying.", "Tell it backward, starting with the ending.", "Write it as a list.",
  "Something has to break.", "Somebody important never shows up.", "Every paragraph is one sentence.",
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function createPromptDeck(rand: Rand = Math.random) {
  const bag = <T,>(items: readonly T[]) => new ShuffleBag(items, rand);
  const character = bag(CHARACTERS);
  const setting = bag(SETTINGS);
  const object = bag(OBJECTS);
  const situation = bag(SITUATIONS);
  const predicament = bag(PREDICAMENTS);
  const firstLine = bag(FIRST_LINES);
  const twist = bag(TWISTS);

  const templates = bag<() => string>([
    () => `${cap(setting.next())}, ${character.next()} finds ${object.next()}.`,
    () => `${cap(setting.next())}, ${character.next()} ${predicament.next()}.`,
    () => `Write a scene ${setting.next()} where ${situation.next()}.`,
    () => `${cap(situation.next())}. Set it ${setting.next()}.`,
    () => `Start your story with ${object.next()} and end it with ${object.next()}.`,
    () => `Tell the story of ${object.next()} from the point of view of ${character.next()}.`,
    () => `Start with this line: “${firstLine.next()}” Your main character is ${character.next()}.`,
  ]);

  return {
    next(bonusWords?: readonly BonusWord[]): GamePrompt {
      const prompt: GamePrompt = { text: templates.next()() };
      if (rand() < 0.5) prompt.twist = twist.next();
      if (bonusWords?.length) prompt.bonus = bonusWords[Math.floor(rand() * bonusWords.length)];
      return prompt;
    },
  };
}

// Webster's 1913 marks insulting or crude senses with these words; skip them.
const UNSUITABLE = /contempt|opprobrious|reproach|derisive|derogatory|vulgar|slang|obscene|lewd|abusive|insult/i;
const CROSS_REFERENCE = /^(See |Same as|Alt\.|Plural|pl\.|imp\.|p\. ?p\.|Obs|An obsolete|Old form|A variant|Variant)/;
// Taxonomy entries are dry, and some definitions were cut off mid-abbreviation.
const DRY_OR_CUT_OFF = /\b(genus|species|family)\b|\b(esp|etc|e\.g|i\.e)$/i;

/**
 * Turns [word, definition] dictionary entries into bonus words, keeping
 * plain single-sentence definitions and skipping cross-references.
 */
export function toBonusWords(entries: readonly [string, string][]): BonusWord[] {
  return entries
    .filter(([word, meaning]) =>
      /^[a-z]{5,12}$/.test(word) &&
      meaning.length >= 15 && meaning.length <= 80 &&
      !/[.()]/.test(meaning) &&
      !CROSS_REFERENCE.test(meaning) &&
      !UNSUITABLE.test(meaning) &&
      !DRY_OR_CUT_OFF.test(meaning) &&
      !meaning.toLowerCase().includes(word)
    )
    .map(([word, meaning]) => ({ word, meaning }));
}
