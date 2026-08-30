export const LOGO_URL = "https://customer-assets-jai6qajn.emergentagent.net/job_0182c08b-be61-4fb5-8204-9b7489a0c619/artifacts/ryhhdxue_MY%20MENOTR%20LOGO.png";

export function Logo({ className = "h-9", showText = false }) {
  return (
    <div className="flex items-center gap-2">
      <img src={LOGO_URL} alt="MyMentor" className={className} />
      {showText && <span className="font-display font-extrabold text-lg text-[#0a2540]">MyMentor</span>}
    </div>
  );
}
