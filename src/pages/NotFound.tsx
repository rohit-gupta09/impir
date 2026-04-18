import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="text-center space-y-4 animate-slide-in">
        <Wrench className="w-20 h-20 mx-auto text-muted-foreground" />
        <h1 className="font-display text-6xl font-bold text-primary">404</h1>
        <p className="font-display text-xl font-bold">Looks like this page got lost at the site!</p>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => navigate('/dashboard')} className="bg-accent hover:bg-accent/90 text-accent-foreground font-display tracking-wide">
          BACK TO HOME
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
