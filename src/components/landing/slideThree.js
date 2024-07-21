import React from "react";
import { PiKeyboard, PiVideo    } from "react-icons/pi";
import { RiAiGenerate } from "react-icons/ri";

const SlideThree = () => {
    return (
        <div className="dark:bg-black">
            <div className="flex items-center justify-center text-center">
                <div className="text-4xl font-black dark:text-white max-md:text-2xl">How it works</div>
            </div>
            <div className="lg:flex py-24 max-md:py-14">
              
                <div className="flex flex-col items-center justify-center lg:w-1/3 pt-6">
                    <PiKeyboard className="text-4xl max-md:text-3xl dark:text-white" />
                    <div className="text-2xl max-md:text-lg pt-4 font-bold  dark:text-white">Enter What You Want To Learn </div>
                    <div className="text-lg max-md:text-xs text-center px-3 pt-2 font-medium  dark:text-white"  >Tell Me What You Want To Learn </div>
                </div>

         
                <div className="flex flex-col items-center justify-center lg:w-1/3 pt-6">
                    <RiAiGenerate  className="text-4xl max-md:text-3xl dark:text-white" />
                    <div className="text-2xl max-md:text-lg pt-4 font-bold  dark:text-white">AI Generates Sub-Topic</div>
                    <div className="text-lg max-md:text-xs text-center px-3 pt-2 font-medium  dark:text-white" >Learnrithm Ai Would Generate Subtopics base on what You Want to learn </div>
                </div>

               
                <div className="flex flex-col items-center justify-center lg:w-1/3 pt-6">
                    <PiVideo   className="text-4xl max-md:text-3xl  dark:text-white" />
                    <div className="text-2xl max-md:text-lg pt-4 font-bold  dark:text-white">Learn with Video & Text</div>
                    <div className="text-lg max-md:text-xs text-center px-3 pt-2 font-medium  dark:text-white" >Learnrithm AI will would Teach you with video and texts course allowing you to learn and understand faster</div>
                </div>
            </div>
        </div>
    );
};

export default SlideThree;
