"use client";

import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import {
  defaultThemeConfig,
  applyTheme,
  exportThemeCSS,
  presetThemes,
  type ThemeConfig,
} from "@/lib/design/theme-config";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Icons
import { 
  Sun, Moon, Copy, Download, RefreshCcw, Palette, 
  AlertCircle, CheckCircle2, Info, XCircle, 
  Calendar, Settings, User, Mail, Lock
} from "lucide-react";

function DesignerPreviewContent() {
  const { theme, setTheme } = useTheme();
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [mounted, setMounted] = useState(false);
  const [copiedCSS, setCopiedCSS] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme whenever config changes
  useEffect(() => {
    if (mounted) {
      applyTheme(themeConfig, theme as 'light' | 'dark');
    }
  }, [themeConfig, theme, mounted]);

  const handlePresetChange = (presetName: string) => {
    if (presetThemes[presetName]) {
      setThemeConfig(presetThemes[presetName]);
    }
  };

  const handleColorChange = (mode: 'light' | 'dark', key: string, value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [key]: value,
      },
    }));
  };

  const handleCopyCSS = () => {
    const css = exportThemeCSS(themeConfig);
    navigator.clipboard.writeText(css);
    setCopiedCSS(true);
    setTimeout(() => setCopiedCSS(false), 2000);
  };

  const handleDownloadCSS = () => {
    const css = exportThemeCSS(themeConfig);
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-colors.css';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setThemeConfig(defaultThemeConfig);
  };

  if (!mounted) {
    return null;
  }

  const currentColors = theme === 'dark' ? themeConfig.dark : themeConfig.light;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Designer Preview</h1>
            <p className="text-muted-foreground mt-2">
              Preview and customize all components with live theme editing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Theme Editor */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Theme Editor
                </CardTitle>
                <CardDescription>
                  Customize colors and see changes in real-time
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyCSS}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedCSS ? 'Copied!' : 'Copy CSS'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadCSS}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Themes */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(presetThemes).map((presetName) => (
                  <Button
                    key={presetName}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetChange(presetName)}
                    className="capitalize"
                  >
                    {presetName}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Color Palette Grid */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Color Palette ({theme === 'dark' ? 'Dark' : 'Light'} Mode)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(currentColors).map(([key, value]) => {
                  if (key === 'radius') return null; // Skip radius for now
                  
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <div className="flex gap-2">
                        <div
                          className="w-12 h-10 rounded border-2 border-border flex-shrink-0"
                          style={{ backgroundColor: `hsl(${value})` }}
                        />
                        <Input
                          id={key}
                          value={value}
                          onChange={(e) => handleColorChange(theme as 'light' | 'dark', key, e.target.value)}
                          className="text-xs font-mono"
                          placeholder="H S% L%"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Components Preview */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Component Showcase</h2>

          {/* Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>All button variants and sizes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <Separator />
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg">Large</Button>
                <Button size="default">Default</Button>
                <Button size="sm">Small</Button>
                <Button size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button>
                  <Mail className="mr-2 h-4 w-4" /> With Icon
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Inputs */}
          <Card>
            <CardHeader>
              <CardTitle>Form Inputs</CardTitle>
              <CardDescription>Text inputs, textareas, and other form controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled">Disabled Input</Label>
                  <Input id="disabled" disabled value="Disabled field" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="select">Select</Label>
                  <Select>
                    <SelectTrigger id="select">
                      <SelectValue placeholder="Choose an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="textarea">Textarea</Label>
                  <Textarea id="textarea" placeholder="Enter your message here" rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkboxes, Switches, and Radio Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Selection Controls</CardTitle>
              <CardDescription>Checkboxes, switches, radio buttons, and sliders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Accept terms and conditions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms2" checked />
                  <Label htmlFor="terms2">Checked checkbox</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms3" disabled />
                  <Label htmlFor="terms3">Disabled checkbox</Label>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="airplane-mode" />
                  <Label htmlFor="airplane-mode">Airplane Mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="airplane-mode-on" checked />
                  <Label htmlFor="airplane-mode-on">Enabled Switch</Label>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="option-one">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-one" id="option-one" />
                    <Label htmlFor="option-one">Option One</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-two" id="option-two" />
                    <Label htmlFor="option-two">Option Two</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-three" id="option-three" />
                    <Label htmlFor="option-three">Option Three</Label>
                  </div>
                </RadioGroup>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Slider</Label>
                <Slider defaultValue={[50]} max={100} step={1} className="w-full max-w-md" />
              </div>
            </CardContent>
          </Card>

          {/* Alerts and Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Alerts & Badges</CardTitle>
              <CardDescription>Status messages and labels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <div className="ml-2">
                  <h5 className="font-medium">Information</h5>
                  <p className="text-sm text-muted-foreground">This is an informational alert message.</p>
                </div>
              </Alert>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div className="ml-2">
                  <h5 className="font-medium">Error</h5>
                  <p className="text-sm">This is an error alert message.</p>
                </div>
              </Alert>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>Card layout examples</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card description goes here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">This is a sample card with some content inside it.</p>
                  </CardContent>
                  <CardFooter>
                    <Button size="sm">Action</Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Another Card</CardTitle>
                    <CardDescription>With different content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Cards can contain any type of content you need.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Third Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Simple card example.</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs</CardTitle>
              <CardDescription>Tabbed navigation component</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tab1" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                  <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Content for Tab 1</p>
                </TabsContent>
                <TabsContent value="tab2" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Content for Tab 2</p>
                </TabsContent>
                <TabsContent value="tab3" className="space-y-4">
                  <p className="text-sm text-muted-foreground">Content for Tab 3</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
              <CardDescription>Data table component</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">John Doe</TableCell>
                    <TableCell>Leader</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Jane Smith</TableCell>
                    <TableCell>Follower</TableCell>
                    <TableCell>
                      <Badge>Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bob Johnson</TableCell>
                    <TableCell>Both</TableCell>
                    <TableCell>
                      <Badge variant="outline">Inactive</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Dialogs and Sheets */}
          <Card>
            <CardHeader>
              <CardTitle>Dialogs & Sheets</CardTitle>
              <CardDescription>Modal dialogs and side panels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog Title</DialogTitle>
                      <DialogDescription>
                        This is a dialog description. You can add any content here.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm">Dialog content goes here.</p>
                    </div>
                    <DialogFooter>
                      <Button variant="outline">Cancel</Button>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Open Sheet</Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Sheet Title</SheetTitle>
                      <SheetDescription>
                        This is a side sheet panel.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4">
                      <p className="text-sm">Sheet content goes here.</p>
                    </div>
                  </SheetContent>
                </Sheet>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Open Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Popover Title</h4>
                      <p className="text-sm text-muted-foreground">
                        This is a popover with some content.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Dropdown and Context Menus */}
          <Card>
            <CardHeader>
              <CardTitle>Menus</CardTitle>
              <CardDescription>Dropdown and context menus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Dropdown Menu</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                    <DropdownMenuItem>Team</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <Button variant="outline">Right Click Me</Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>Edit</ContextMenuItem>
                    <ContextMenuItem>Copy</ContextMenuItem>
                    <ContextMenuItem>Delete</ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            </CardContent>
          </Card>

          {/* Command Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Command Palette</CardTitle>
              <CardDescription>Searchable command interface</CardDescription>
            </CardHeader>
            <CardContent>
              <Command className="rounded-lg border shadow-md">
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Calendar</span>
                    </CommandItem>
                    <CommandItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </CommandItem>
                    <CommandItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>This page is for designers only - no authentication required</p>
              <p className="mt-1">Make changes to see them reflected across all components in real-time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DesignerPreviewPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <DesignerPreviewContent />
    </ThemeProvider>
  );
}

