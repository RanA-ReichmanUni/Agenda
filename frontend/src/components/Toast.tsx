import React, { useState } from "react";
import { useToastContext } from "../context/ToastContext";

export default function ShowToast() {

const {showUndo,undoDelete} = useToastContext();
const [visible, setVisible] = useState(true);

if(!visible || !showUndo){
    return null;
}

return (<div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
            <div className="flex items-center space-x-2">
                <span> Item Deleted</span>
                {undoDelete && (
                    <button onClick={undoDelete} className="text-blue-400 hover:underline">
                        Undo Deletion
                    </button>

                )}
                <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white ml-4">
                    x
                </button>
            </div>
        </div>);

}