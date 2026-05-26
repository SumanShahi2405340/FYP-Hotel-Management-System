'use client';

import useAdminTheme from '@/components/useAdminTheme';

export default function AdminFeatureThemeWrapper({ title, subtitle, children }) {
  const { classes } = useAdminTheme();

  return (
    <div className={`min-h-screen p-8 transition-all duration-500 ${classes.page}`}>
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && (
              // Remove the wrapper span — let the h1 itself carry the class
              <h1 className={`text-3xl font-bold ${classes.heading}`}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className={`mt-2 ${classes.subText}`}>{subtitle}</p>
            )}
          </div>
        )}

        <div className={`rounded-2xl border p-6 transition-all duration-500 ${classes.card}`}>
          {children}
        </div>
      </div>
    </div>
  );
}