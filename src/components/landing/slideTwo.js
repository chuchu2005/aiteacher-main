import React from 'react';
import slide from '../../res/img/slideTwo.svg'
import { PiStudentFill, PiFeatherFill } from "react-icons/pi";

const SlideTwo = () => {
    return (
        <div className="px-7 justify-center items-center pb-10 dark:bg-black">
            <div className="flex flex-col md:flex-row items-center">

                <div className="md:w-1/2 h-full p-4 flex flex-col items-center md:items-start justify-center">

                    <h2 className="text-4xl font-black mb-2 max-md:text-2xl dark:text-white" >Unlock Infinite Knowledge</h2>


                    <p className="text-black mb-2 mt-2 max-md:text-center max-md:text-xs dark:text-white">
                    Having trouble with a tough school subject? Meet Learnrithm's AI teacher! It's like having a smart friend who helps you understand tricky things in a fun way. Whether you're stuck on hard topics or need some extra help, our AI teacher is here to make learning easier for you. Let's learn together and make school more fun and exciting!
                    </p>


                    <div className='flex flex-row justify-center mt-4'>
                        <div className="md:w-1/2 mb-2 md:mb-0  mx-2 max-md:text-center">
                            <div className='max-md:flex max-md:justify-center max-md:items-center'>
                                <PiStudentFill className='text-2xl max-md:text-xl dark:text-white' />
                            </div>
                            <h3 className="text-xl font-bold mb-2 max-md:text-xl dark:text-white" >Study Online</h3>
                            <p className='text-black max-md:text-xs dark:text-white'>Video & Theory Lecture</p>
                        </div>

                        <div className="md:w-1/2 mb-2 md:mb-0 mx-2 max-md:text-center">
                            <div className='max-md:flex max-md:justify-center max-md:items-center'>
                                <PiFeatherFill className='text-2xl max-md:text-xl dark:text-white' />
                            </div>
                            <h3 className="text-xl font-bold mb-2 max-md:text-xl dark:text-white">Learn A New Thing  </h3>
                            <p className='text-black max-md:text-xs dark:text-white'>Having Dificulty Learning or Understanding a course?</p>
                        </div>
                    </div>
                </div>
                <div className="md:w-1/2 h-full">
                    <img
                        src={slide}
                        alt="Your Alt Text"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

export default SlideTwo;
