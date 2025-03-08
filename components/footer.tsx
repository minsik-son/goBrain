import React from 'react';


export default function Footer() {  
    return (
    <footer className="border-t py-6 md:py-0">
    <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
      <p className="text-center text-sm text-muted-foreground md:text-left">
        &copy; {new Date().getFullYear()} AI Translator. All rights reserved.
      </p>
    </div>
  </footer>
  );
};
