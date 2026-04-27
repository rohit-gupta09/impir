import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    };

    handleAuth();
  }, [navigate]);

  return <p>Verifying your email...</p>;
}