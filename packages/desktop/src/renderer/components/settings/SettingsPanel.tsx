import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@renderer/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@renderer/components/ui/tabs';
import { ProviderConfig } from './ProviderConfig';
import { AppearanceSettings } from './AppearanceSettings';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="provider" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="provider" className="flex-1">
              Provider
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex-1">
              Appearance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="provider" className="pt-4">
            <ProviderConfig />
          </TabsContent>
          <TabsContent value="appearance" className="pt-4">
            <AppearanceSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
