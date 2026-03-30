import { useState } from "react";
import { Settings, Store } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SellerConfigList from "@/components/seller-config/SellerConfigList";
import SellerConfiguration from "@/components/seller-config/SellerConfiguration";

const SellerConfigPage = () => {
  const [activeTab, setActiveTab] = useState("sellers");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Seller Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all seller setups and system configuration settings.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sellers" className="flex items-center gap-2">
            <Store size={16} />
            <span>Sellers</span>
          </TabsTrigger>
          <TabsTrigger
            value="configuration"
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Configuration</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sellers" className="mt-6">
          <SellerConfigList />
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <SellerConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerConfigPage;
