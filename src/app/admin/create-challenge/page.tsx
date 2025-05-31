
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
import { useRouter } from "next/navigation";
import Link from "next/link"; 
import { useAuth } from '@/context/AuthContext'; // Import useAuth


const gameSchema = z.object({
  name: z.string().min(1, "Game name is required.").max(50, "Game name too long."),
  iconName: z.string().min(1, "Icon name is required.").toLowerCase().max(30, "Icon name too long."),
  objective: z.string().min(1, "Objective is required.").max(150, "Objective too long."),
  targetProgress: z.coerce.number().positive("Target progress must be a positive number.").optional().nullable(),
  enableTryCounter: z.boolean().optional().default(false),
  enableManualLog: z.boolean().optional().default(false),
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
  enableManualLog: false 
};

const defaultValues: ChallengeFormValues = { 
  title: "",
  scheduledDateTime: new Date(new Date().setDate(new Date().getDate() + 7)), 
  image: "",
  games: [defaultGameValues],
};

export default function CreateChallengePage() {
  const { isAdmin } = useAuth(); // Get isAdmin status
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

  const [blockers, setBlockers] = useState<{ hasLiveChallenge: boolean; hasUpcomingChallenge: boolean } | null>(null);
  const [isLoadingBlockers, setIsLoadingBlockers] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/admin/login'); // Redirect if not admin
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
    checkBlockers();
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
                    <Link href={`/challenges/${result.id}`} className="text-xs text-primary hover:underline mt-1 block">View Challenge Details</Link>
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
  
  if (!isAdmin && !isLoadingBlockers) { // Check after blockers might have loaded to avoid flash of content
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
                      <Input placeholder="e.g., The Weekend Warrior Gauntlet" {...field} className="text-base py-2.5"/>
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
                      <FormLabel className="text-lg font-semibold">Scheduled Date & Time</FormLabel>
                      <Popover>
                          <PopoverTrigger asChild>
                          <FormControl>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full pl-3 text-left font-normal text-base py-2.5 justify-start",
                                  !field.value && "text-muted-foreground"
                              )}
                              >
                              {field.value ? (
                                  format(field.value, "PPPp")
                              ) : (
                                  <span>Pick date and time</span>
                              )}
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
                              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} 
                              initialFocus
                          />
                          <div className="p-3 border-t border-border">
                              <FormLabel className="mb-1.5 block text-sm font-medium">Time (HH:mm)</FormLabel>
                              <Input 
                              type="time"
                              className="text-base"
                              defaultValue={field.value ? format(field.value, "HH:mm") : "12:00"}
                              onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':').map(Number);
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
                                  <UploadCloud className="h-5 w-5 text-muted-foreground"/>
                                  <Input type="url" placeholder="https://placehold.co/600x400.png" {...field} className="text-base py-2.5"/>
                              </div>
                          </FormControl>
                          <FormDescription>
                              Link to an image for the challenge banner (e.g., from placehold.co).
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
                  <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append(defaultGameValues)}
                      className="shadow-sm mt-3 sm:mt-0 shrink-0"
                      disabled={fields.length >= 15 || !canCreate || isSubmittingForm}
                  >
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Game
                  </Button>
                </div>
                
                {fields.length === 0 && (
                  <div className="text-center py-6 border border-dashed rounded-md mt-6">
                      <GameIconFactory iconName="default" className="h-12 w-12 text-muted-foreground mx-auto mb-2"/>
                      <p className="text-sm text-muted-foreground">No games added yet. Click "Add Game" to begin constructing the challenge!</p>
                  </div>
                )}
                <div className="space-y-6 mt-6">
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-5 bg-card shadow-md rounded-lg border relative overflow-hidden">
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove game</span>
                    </Button>
                    <h4 className="font-semibold text-md text-primary flex items-center gap-2 mb-4">
                        <GameIconFactory iconName={form.watch(`games.${index}.iconName`) || 'default'} className="h-5 w-5" /> 
                        Game #{index + 1} Configuration
                    </h4>
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
                              <Input placeholder="e.g., valorant, cs2 (lowercase)" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              From `GameIconFactory.tsx`.
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
                              <Textarea placeholder="e.g., Achieve 5 wins in ranked mode" {...field} rows={2}/>
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
                              <Input type="number" min="1" placeholder="e.g., 5 (for 5 wins)" {...field} 
                                onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))} 
                                value={field.value === null || field.value === undefined ? '' : field.value}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                                Quantifiable goal (e.g., number of wins). Used for Win/Incr. button.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                            control={form.control}
                            name={`games.${index}.enableTryCounter`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Enable Try Counter?</FormLabel>
                                    <FormDescription className="text-xs">
                                    Adds a "+ Try" button to log attempts for this game.
                                    </FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`games.${index}.enableManualLog`}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Enable Notes for Logs?</FormLabel>
                                    <FormDescription className="text-xs">
                                    Adds a text field to Win/Try buttons for manual notes.
                                    </FormDescription>
                                </div>
                                </FormItem>
                            )}
                        />
                    </div>
                  </Card>
                ))}
                </div>
              </div>
            </fieldset>

            <Separator className="!mt-10"/>
            <Button 
              type="submit" 
              size="lg" 
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold py-3 shadow-lg hover:shadow-xl transition-shadow" 
              disabled={!canCreate || isSubmittingForm || (!form.formState.isValid && form.formState.isSubmitted)}
            >
              {isSubmittingForm ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting Challenge...</>) : "Create Challenge & Unleash Fun!"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
