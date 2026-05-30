
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GameIconFactory } from "@/components/icons/GameIconFactory";
import { PlusCircle, Trash2, Calendar as CalendarIcon, Edit, UploadCloud, ShieldAlert, Loader2, ShieldX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState, useTransition } from "react";
import { getChallengeCreationBlockers, createNewChallengeAction } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GAME_PRESETS,
  getPresetById,
  getPresetCategories,
  buildGameDraft,
  CUSTOM_GAME_DRAFT,
  CUSTOM_PRESET_ID,
  type GamePreset,
  type GamePresetVariant,
  type GameDraft,
} from "@/lib/game-presets";
import type { GameTrackingType } from "@/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';

const gameSchema = z.object({
  name: z.string().min(1, "Game name is required.").max(60, "Game name too long."),
  iconName: z.string().min(1, "Icon name is required.").toLowerCase().max(30, "Icon name too long."),
  objective: z.string().min(1, "Objective is required.").max(150, "Objective too long."),
  targetProgress: z.coerce.number().positive("Target progress must be a positive number.").optional().nullable(),
  enableTryCounter: z.boolean().optional().default(false),
  enableManualLog: z.boolean().optional().default(true),
  presetId: z.string().optional().default(CUSTOM_PRESET_ID),
  trackingType: z.enum(['winLossDraw', 'attempts', 'score', 'completion']).optional().default('attempts'),
  allowDraw: z.boolean().optional().default(false),
  backToBack: z.boolean().optional().default(false),
  scoreUnit: z.string().max(8).optional().default(''),
  scoreLabel: z.string().max(40).optional().default(''),
  attemptLabel: z.string().max(24).optional().default(''),
  winLabel: z.string().max(24).optional().default(''),
});

const challengeFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").max(100, "Title too long."),
  scheduledDateTime: z.date({
    required_error: "A date and time for the challenge is required.",
  }).refine(date => date > new Date(), {
    message: "Scheduled date must be in the future."
  }),
  image: z.string().url("Must be a valid URL for the image.").optional().or(z.literal('')),
  games: z.array(gameSchema).min(1, "At least one game must be added.").max(15, "Maximum 15 games allowed."),
});

export type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

const defaultGameValues = {
  name: "",
  iconName: "default",
  objective: "",
  targetProgress: undefined as number | undefined | null,
  enableTryCounter: false,
  enableManualLog: true,
  presetId: CUSTOM_PRESET_ID,
  trackingType: 'attempts' as GameTrackingType,
  allowDraw: false,
  backToBack: false,
  scoreUnit: '',
  scoreLabel: '',
  attemptLabel: '',
  winLabel: '',
};

const defaultValues: ChallengeFormValues = {
  title: "",
  scheduledDateTime: new Date(new Date().setDate(new Date().getDate() + 7)),
  image: "",
  games: [defaultGameValues],
};

const describeMode = (trackingType?: GameTrackingType, backToBack?: boolean, allowDraw?: boolean): string => {
  switch (trackingType) {
    case 'winLossDraw': return backToBack ? 'Siege in Folge (Streak)' : allowDraw ? 'Sieg / Niederlage / Remis' : 'Sieg / Niederlage';
    case 'attempts': return 'Versuche + Platzierung';
    case 'score': return 'Ziel-Score (Bestwert)';
    case 'completion': return 'Completion / Zeit';
    default: return 'Versuche';
  }
};

export default function CreateChallengePage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmittingForm, startSubmitTransition] = useTransition();
  const form = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "games",
  });

  const presetCategories = getPresetCategories();
  const presetsByCategory = presetCategories.reduce<Record<string, GamePreset[]>>((acc, cat) => {
    acc[cat] = GAME_PRESETS.filter((preset) => preset.category === cat);
    return acc;
  }, {});

  const applyDraft = (index: number, draft: GameDraft) => {
    form.setValue(`games.${index}.presetId`, draft.presetId, { shouldValidate: true });
    form.setValue(`games.${index}.name`, draft.name, { shouldValidate: true });
    form.setValue(`games.${index}.iconName`, draft.iconName, { shouldValidate: true });
    form.setValue(`games.${index}.objective`, draft.objective, { shouldValidate: true });
    form.setValue(`games.${index}.targetProgress`, draft.targetProgress, { shouldValidate: true });
    form.setValue(`games.${index}.trackingType`, draft.trackingType);
    form.setValue(`games.${index}.allowDraw`, draft.allowDraw);
    form.setValue(`games.${index}.backToBack`, draft.backToBack);
    form.setValue(`games.${index}.scoreUnit`, draft.scoreUnit);
    form.setValue(`games.${index}.scoreLabel`, draft.scoreLabel);
    form.setValue(`games.${index}.attemptLabel`, draft.attemptLabel);
    form.setValue(`games.${index}.winLabel`, draft.winLabel);
    form.setValue(`games.${index}.enableTryCounter`, draft.trackingType !== 'winLossDraw');
    form.setValue(`games.${index}.enableManualLog`, true);
  };

  const handlePresetChange = (index: number, presetId: string) => {
    if (presetId === CUSTOM_PRESET_ID) {
      applyDraft(index, { ...CUSTOM_GAME_DRAFT });
      return;
    }
    const preset = getPresetById(presetId);
    if (preset) applyDraft(index, buildGameDraft(preset));
  };

  const handleVariantPick = (index: number, preset: GamePreset, variant: GamePresetVariant) => {
    applyDraft(index, buildGameDraft(preset, variant));
  };

  const [blockers, setBlockers] = useState<{ hasLiveChallenge: boolean; hasUpcomingChallenge: boolean } | null>(null);
  const [isLoadingBlockers, setIsLoadingBlockers] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login');
      return;
    }

    const checkBlockers = async () => {
      setIsLoadingBlockers(true);
      try {
        const currentBlockers = await getChallengeCreationBlockers();
        setBlockers(currentBlockers);
      } catch (error) {
        console.error("Failed to check challenge creation blockers:", error);
        toast({
          title: "Error checking prerequisites",
          description: "Could not verify if a challenge can be created. Please try refreshing.",
          variant: "destructive",
        });
        setBlockers({ hasLiveChallenge: false, hasUpcomingChallenge: false });
      }
      setIsLoadingBlockers(false);
    };
    void checkBlockers();
  }, [isAdmin, router, toast]);

  async function onSubmit(data: ChallengeFormValues) {
    if (!isAdmin) {
      toast({ title: "Unauthorized", description: "You are not authorized to perform this action.", variant: "destructive" });
      return;
    }
    startSubmitTransition(async () => {
      setIsLoadingBlockers(true);
      const currentBlockers = await getChallengeCreationBlockers();
      setIsLoadingBlockers(false);

      if (currentBlockers.hasLiveChallenge || currentBlockers.hasUpcomingChallenge) {
        setBlockers(currentBlockers);
        toast({
          title: "Cannot Create Challenge",
          description: `A ${currentBlockers.hasLiveChallenge ? 'live' : 'upcoming'} challenge already exists. Please wait for it to conclude or manage it before creating a new one.`,
          variant: "destructive",
        });
        return;
      }

      try {
        const result = await createNewChallengeAction(data);
        if (result) {
          toast({
            title: "Challenge Created Successfully!",
            description: (
              <div className="mt-2 w-full max-w-md rounded-md bg-muted p-3">
                <p className="text-sm font-medium">"{result.title}" scheduled for {format(new Date(result.scheduledDateTime!), "PPPp")}.</p>
                <Link href={`/challenges/view?id=${result.id}`} className="text-xs text-primary hover:underline mt-1 block">View Challenge Details</Link>
              </div>
            ),
            variant: "default",
          });
          form.reset(defaultValues);
        } else {
          toast({
            title: "Challenge Creation Failed",
            description: "An unexpected error occurred while creating the challenge. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Challenge creation error:", error);
        toast({
          title: "Challenge Creation Error",
          description: (error as Error).message || "Something went wrong.",
          variant: "destructive",
        });
      }
    });
  }

  if (!isAdmin && !isLoadingBlockers) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ShieldX className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You must be an administrator to access this page.</p>
        <Button asChild>
          <Link href="/admin/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  const canCreate = !isLoadingBlockers && blockers && !blockers.hasLiveChallenge && !blockers.hasUpcomingChallenge && isAdmin;

  if (isLoadingBlockers && !isSubmittingForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-4 text-xl text-muted-foreground">Checking prerequisites...</span>
      </div>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-2xl rounded-xl border border-border">
      <CardHeader className="p-6 bg-muted/30 dark:bg-muted/20 rounded-t-xl">
        <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-primary">
          <Edit className="h-7 w-7 sm:h-8 sm:w-8" />
          Craft New Challenge
        </CardTitle>
        <CardDescription className="text-base mt-1">
          Assemble the ultimate contest. Define games, objectives, and schedule the showdown!
        </CardDescription>
      </CardHeader>
      <Separator />
      <CardContent className="p-6 md:p-8">
        {blockers && (blockers.hasLiveChallenge || blockers.hasUpcomingChallenge) && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle>Cannot Create New Challenge</AlertTitle>
            <AlertDescription>
              A {blockers.hasLiveChallenge ? 'LIVE challenge' : 'challenge is already UPCOMING'}.
              You must wait for it to conclude or manage it before creating a new one.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <fieldset disabled={!canCreate || isSubmittingForm}>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Challenge Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., The Weekend Warrior Gauntlet" {...field} className="text-base py-2.5" />
                    </FormControl>
                    <FormDescription>
                      A catchy and descriptive name for this epic challenge.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <FormField
                  control={form.control}
                  name="scheduledDateTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-lg font-semibold">Scheduled Date and Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn("w-full pl-3 text-left font-normal text-base py-2.5 justify-start", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPPp") : <span>Pick date and time</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const newDate = new Date(date);
                                newDate.setHours(field.value ? new Date(field.value).getHours() : 12);
                                newDate.setMinutes(field.value ? new Date(field.value).getMinutes() : 0);
                                field.onChange(newDate);
                              } else {
                                field.onChange(date);
                              }
                            }}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                            initialFocus
                          />
                          <div className="p-3 border-t border-border">
                            <FormLabel className="mb-1.5 block text-sm font-medium">Time (HH:mm)</FormLabel>
                            <Input
                              type="time"
                              className="text-base"
                              defaultValue={field.value ? format(field.value, "HH:mm") : "12:00"}
                              onChange={(event) => {
                                const [hours, minutes] = event.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date();
                                if (!isNaN(hours) && !isNaN(minutes)) {
                                  newDate.setHours(hours);
                                  newDate.setMinutes(minutes);
                                  field.onChange(newDate);
                                }
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When the challenge will officially kick off.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Challenge Image URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <UploadCloud className="h-5 w-5 text-muted-foreground" />
                          <Input type="url" placeholder="https://placehold.co/600x400.png" {...field} className="text-base py-2.5" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Link to an image for the challenge banner.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6 !mt-10 !mb-8" />

              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <div>
                    <FormLabel className="text-lg font-semibold">Challenge Games ({fields.length})</FormLabel>
                    <FormDescription className="mt-0.5">
                      Define each game, its objective, and tracking options.
                    </FormDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append(defaultGameValues)} className="shadow-sm mt-3 sm:mt-0 shrink-0" disabled={fields.length >= 15 || !canCreate || isSubmittingForm}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Game
                  </Button>
                </div>

                {fields.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-md mt-6">
                    <GameIconFactory iconName="default" className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No games added yet. Click Add Game to begin constructing the challenge.</p>
                  </div>
                )}
                <div className="space-y-6 mt-6">
                  {fields.map((item, index) => (
                    <Card key={item.id} className="p-5 bg-card shadow-md rounded-lg border relative overflow-hidden">
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove game</span>
                      </Button>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <h4 className="font-semibold text-md text-primary flex items-center gap-2 min-w-0">
                          <GameIconFactory iconName={form.watch(`games.${index}.iconName`) || 'default'} className="h-5 w-5 shrink-0" />
                          <span className="truncate">{form.watch(`games.${index}.name`) || `Spiel #${index + 1}`}</span>
                        </h4>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {describeMode(form.watch(`games.${index}.trackingType`), form.watch(`games.${index}.backToBack`), form.watch(`games.${index}.allowDraw`))}
                        </Badge>
                      </div>

                      <div className="mb-4 space-y-3">
                        <FormField
                          control={form.control}
                          name={`games.${index}.presetId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spiel-Vorlage</FormLabel>
                              <Select value={field.value || CUSTOM_PRESET_ID} onValueChange={(value) => handlePresetChange(index, value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Spiel wählen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={CUSTOM_PRESET_ID}>✏️ Eigenes Spiel (Custom)</SelectItem>
                                  {presetCategories.map((category) => (
                                    <SelectGroup key={category}>
                                      <SelectLabel>{category}</SelectLabel>
                                      {presetsByCategory[category].map((preset) => (
                                        <SelectItem key={preset.id} value={preset.id}>
                                          <span className="flex items-center gap-2">
                                            <GameIconFactory iconName={preset.iconName} className="h-4 w-4" />
                                            {preset.name}
                                          </span>
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  ))}
                                </SelectContent>
                              </Select>
                              {(() => {
                                const preset = getPresetById(field.value);
                                return (
                                  <FormDescription className="text-xs">
                                    {preset ? preset.blurb : 'Frei konfigurierbar – Logging-Modus unten unter „Erweitert" wählen.'}
                                  </FormDescription>
                                );
                              })()}
                            </FormItem>
                          )}
                        />

                        {(() => {
                          const preset = getPresetById(form.watch(`games.${index}.presetId`));
                          if (!preset?.variants?.length) return null;
                          const currentTarget = form.watch(`games.${index}.targetProgress`) ?? null;
                          const currentB2B = Boolean(form.watch(`games.${index}.backToBack`));
                          return (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">Variante</span>
                              <div className="mt-1.5 flex flex-wrap gap-2">
                                {preset.variants.map((variant) => {
                                  const variantTarget = variant.target ?? preset.target ?? null;
                                  const active = variantTarget === currentTarget && Boolean(variant.backToBack) === currentB2B;
                                  return (
                                    <Button
                                      key={variant.id}
                                      type="button"
                                      size="sm"
                                      variant={active ? 'default' : 'outline'}
                                      onClick={() => handleVariantPick(index, preset, variant)}
                                    >
                                      {variant.label}
                                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField
                          control={form.control}
                          name={`games.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Game Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Valorant" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`games.${index}.iconName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icon Key</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., valorant, cs2" {...field} />
                              </FormControl>
                              <FormDescription className="text-xs">
                                From GameIconFactory.tsx.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`games.${index}.objective`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Objective Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="e.g., Achieve 5 wins in ranked mode" {...field} rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`games.${index}.targetProgress`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Wins/Score <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="e.g., 5"
                                  {...field}
                                  onChange={event => field.onChange(event.target.value === '' ? null : parseInt(event.target.value, 10))}
                                  value={field.value === null || field.value === undefined ? '' : field.value}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Quantifiable goal used for progress tracking.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <details className="md:col-span-2 rounded-md border bg-muted/20 px-3 py-2">
                          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Erweitert: Logging-Modus &amp; Buttons</summary>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField
                              control={form.control}
                              name={`games.${index}.trackingType`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Logging-Modus</FormLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="winLossDraw">Sieg / Niederlage / Remis</SelectItem>
                                      <SelectItem value="attempts">Versuche + Platzierung</SelectItem>
                                      <SelectItem value="score">Ziel-Score</SelectItem>
                                      <SelectItem value="completion">Completion / Zeit</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormDescription className="text-xs">Bestimmt, welche Log-Buttons im Live-Dashboard erscheinen.</FormDescription>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`games.${index}.winLabel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Label „Sieg"-Button</FormLabel>
                                  <FormControl><Input placeholder="z.B. Victory Royale, Crown" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`games.${index}.attemptLabel`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Label „Versuch"-Button</FormLabel>
                                  <FormControl><Input placeholder="z.B. Match, Drop, Runde" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`games.${index}.scoreLabel`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Label / Platzhalter Eingabefeld</FormLabel>
                                  <FormControl><Input placeholder="z.B. Score (13:5) oder Platz" {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`games.${index}.allowDraw`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-3">
                                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                  <FormLabel className="!mt-0">Remis-Button anzeigen</FormLabel>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`games.${index}.backToBack`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-3">
                                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                  <FormLabel className="!mt-0">Back-to-Back (Serie)</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </details>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </fieldset>

            <Separator className="!mt-10" />
            <Button type="submit" size="lg" className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold py-3 shadow-lg hover:shadow-xl transition-shadow" disabled={!canCreate || isSubmittingForm || (!form.formState.isValid && form.formState.isSubmitted)}>
              {isSubmittingForm ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting Challenge...</>) : "Create Challenge and Unleash Fun!"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
