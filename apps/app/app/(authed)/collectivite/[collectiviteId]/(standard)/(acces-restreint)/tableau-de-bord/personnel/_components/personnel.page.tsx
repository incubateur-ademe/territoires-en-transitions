'use client';

import Header from '../../_components/header';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  return (
    <>
      <Header activeTab="personnel" />
      <div className="flex flex-col gap-8 mt-8">
        <Metrics />
        <Modules />
      </div>
    </>
  );
};

export default PersonnelPage;
